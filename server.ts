import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use((req, res, next) => {
    if (req.path.endsWith('.php')) {
      next();
    } else {
      express.json()(req, res, next);
    }
  });

  // 1. Setup MySQL Connection Pool (Using PHP Bridge)
  const API_KEY = 'IMF_SECRET_KEY_902643667_2026';
  const API_URL = 'https://inspiremyfaith.com/api/api.php';

  const pool = {
    query: async (sql: string, params: any[] = []) => {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          },
          body: JSON.stringify({ query: sql, params })
        });
        
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse PHP bridge response:", text);
          throw new Error("Invalid response from PHP bridge");
        }

        if (response.status !== 200 || data.error) {
          throw new Error(data.error || 'Database proxy error');
        }

        // Return rows if it's a SELECT/SHOW, else return mutation metadata
        if (data.data !== undefined) {
           return [data.data, []];
        }
        return [{ affectedRows: data.affected_rows, insertId: data.insert_id }, []];
      } catch (err) {
        console.error("PHP Bridge Error executing SQL:", err);
        throw err;
      }
    },
    getConnection: async () => {
      return {
        query: pool.query,
        release: () => {} // Dummy method to prevent crashes when the server tries to release the connection
      };
    }
  };

  // 1.5 Init user_saved_prompts table if not exists
  pool.query(`
    CREATE TABLE IF NOT EXISTS user_saved_prompts (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      text TEXT,
      answered BOOLEAN DEFAULT FALSE,
      timestamp BIGINT,
      isPinned BOOLEAN DEFAULT FALSE,
      reflection TEXT,
      collections JSON,
      verses JSON,
      INDEX idx_user_id (user_id)
    )
  `).catch(err => console.error("Error creating user_saved_prompts table:", err));

  pool.query(`
    CREATE TABLE IF NOT EXISTS user_prompt_collections (
      prompt_id VARCHAR(255) NOT NULL,
      collection_name VARCHAR(255) NOT NULL,
      PRIMARY KEY (prompt_id, collection_name)
    )
  `).catch(err => console.error("Error creating user_prompt_collections table:", err));

  pool.query(`
    CREATE TABLE IF NOT EXISTS user_faith_verses (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      book_name VARCHAR(255),
      chapter INT,
      verse_num VARCHAR(50),
      text TEXT,
      version VARCHAR(50),
      note TEXT,
      saved_at BIGINT,
      is_pinned BOOLEAN DEFAULT FALSE,
      is_memorized BOOLEAN DEFAULT FALSE,
      INDEX idx_user_id (user_id)
    )
  `).catch(err => console.error("Error creating user_faith_verses table:", err));

  (async () => {
    try {
      await pool.query(`ALTER TABLE user_faith_verses MODIFY verse_num VARCHAR(50)`);
    } catch (e) { }
    
    try {
      const [columns]: any = await pool.query(`SHOW COLUMNS FROM user_faith_verses`);
      const colNames = columns.map((c: any) => c.Field);
      
      if (!colNames.includes('saved_at')) {
        if (colNames.includes('timestamp')) {
          await pool.query(`ALTER TABLE user_faith_verses RENAME COLUMN timestamp TO saved_at`);
        } else {
          await pool.query(`ALTER TABLE user_faith_verses ADD COLUMN saved_at BIGINT`);
        }
      }
      
      if (!colNames.includes('is_pinned')) {
        if (colNames.includes('isPinned')) {
          await pool.query(`ALTER TABLE user_faith_verses RENAME COLUMN isPinned TO is_pinned`);
        } else {
          await pool.query(`ALTER TABLE user_faith_verses ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE`);
        }
      }

      if (!colNames.includes('is_memorized')) {
        await pool.query(`ALTER TABLE user_faith_verses ADD COLUMN is_memorized BOOLEAN DEFAULT FALSE`);
      }
    } catch (error: any) {
      console.error("Migration error:", error.message);
    }
  })();

  pool.query(`
    CREATE TABLE IF NOT EXISTS user_faith_verse_collections (
      verse_id VARCHAR(255) NOT NULL,
      collection_name VARCHAR(255) NOT NULL,
      PRIMARY KEY (verse_id, collection_name)
    )
  `).catch(err => console.error("Error creating user_faith_verse_collections table:", err));

  // 2. API Route: Test MySQL Connection
  app.get('/api/test-db', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT 1 + 1 AS solution');
      res.json({ success: true, message: 'Connected to MySQL!', data: rows });
    } catch (error) {
      console.error('Database connection failed:', error);
      res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  });

  // 3. API Routes: Bible Data
  app.get('/api/bible/books', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          b.*,
          COUNT(v.id) as total_verses,
          COUNT(vt.verse_id) as imf_verses
        FROM books b
        LEFT JOIN verses v ON b.id = v.book_id
        LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
        GROUP BY b.id
        ORDER BY b.book_order ASC
      `);
      
      const data = (rows as any[]).map(row => ({
        ...row,
        completed: row.total_verses > 0 && row.total_verses === row.imf_verses
      }));

      res.json({ success: true, data });
    } catch (error: any) {
      console.error(error);
      try {
        fs.appendFileSync('db-errors.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\\n');
      } catch (e) {}
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  });

  app.get('/api/bible/books/:bookId/chapters', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT MAX(chapter) as chapterCount FROM verses WHERE book_id = ?',
        [req.params.bookId]
      );
      const data = rows as any[];
      res.json({ success: true, data: data[0].chapterCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.get('/api/bible/verses/:bookId/:chapter', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT v.*, b.name as book_name FROM verses v JOIN books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter = ? ORDER BY v.verse ASC',
        [req.params.bookId, req.params.chapter]
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.get('/api/bible/summary/:bookId/:chapter', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?',
        [req.params.bookId, req.params.chapter]
      );
      if ((rows as any[]).length > 0) {
        res.json({ success: true, data: (rows as any[])[0].summary });
      } else {
        res.json({ success: true, data: null });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/bible/auto-tag', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: 'Text is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'No GEMINI_API_KEY found' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert Bible formatter. Below is a text from the New Testament.
Your task is to identify any direct quotes spoken by Jesus Christ or God the Father.
Wrap exactly the words they speak in \`[red]\` and \`[/red]\`.
DO NOT change any words, punctuation, or formatting other than adding the bracket tags around the spoken words.
If the text does not contain words spoken by Jesus or God, leave the text exactly as it is.

For example:
Input: "Jesus answered, \\"I am the way and the truth and the life.\\""
Output: "Jesus answered, \\"[red]I am the way and the truth and the life.[/red]\\""

Here is the text to process:
${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt
      });
      
      const taggedText = response.text?.trim() || text;

      res.json({ success: true, data: taggedText });
    } catch (error) {
      console.error('Auto-tag error:', error);
      res.status(500).json({ success: false, message: 'Error tagging text' });
    }
  });



  app.post('/api/soul-search/summary', async (req, res) => {
    try {
      const { prayers, seasonName } = req.body;
      if (!prayers || prayers.length === 0) {
        return res.status(400).json({ success: false, message: 'Prayers are required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'No GEMINI_API_KEY found' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prayersText = prayers.map((p: any) => `Date: ${new Date(p.timestamp).toLocaleDateString()}\nTopic: ${p.title}\nPrayer: ${p.text}`).join('\n\n');

      const prompt = `You are a compassionate, encouraging Christian AI pastor writing a short pastoral summary (about 3-4 paragraphs) to a user based on their recent prayers.
The user has saved these prayers under the theme/season: "${seasonName || 'My Faith Journey'}".

Here are their prayers:
${prayersText}

Write a gentle, encouraging letter to them. Address them as "Dear Friend," and ALWAYS sign off at the very end with "Your AI Pastor". Do not sign off as "Your Pastor" or anything else. It must be clear that you are an AI.
Analyze their spiritual journey based on these prayers. Acknowledge their struggles, notice any growth in faith, and offer biblical comfort.
Do NOT use heavy markdown formatting. You may use **bold** or *italics* sparingly, but do not use large headers or lists. Write it as a heartfelt letter.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
      });

      res.json({ success: true, data: response.text });
    } catch (error) {
      console.error('Pastoral summary error:', error);
      res.status(500).json({ success: false, message: 'Error generating summary' });
    }
  });

  app.post('/api/soul-search', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: 'Text is required' });
      }

      let prayer = null;
      try {
        console.log("Generating prayer for text:", text);
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Write a short, comforting personal prayer (2-3 sentences) for someone who is feeling/experiencing: "${text}". Keep it compassionate, uplifting, and rooted in Christian faith. Do not use markdown, just text.`;
          const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
          });
          prayer = response.text;
          console.log("Prayer generated:", prayer);
        } else {
          console.log("No GEMINI_API_KEY found");
          prayer = "ERROR: No GEMINI_API_KEY found in server";
        }
      } catch (e: any) {
        console.error("Prayer generation failed:", e);
        prayer = "ERROR: " + (e.message || e.toString());
      }

      const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
      const [topics] = await pool.query('SELECT id, name, keywords FROM topics');
      
      let matchedTopicIds = new Set<number>();
      for (const topic of (topics as any[])) {
        const keywords = topic.keywords.split(',');
        for (const kw of keywords) {
          if (words.includes(kw.trim())) {
            matchedTopicIds.add(topic.id);
            break;
          }
        }
      }

      if (matchedTopicIds.size === 0) {
        // --- AI FALLBACK & HARVESTING ENGINE ---
        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error('No API key for fallback');
          }
          const { GoogleGenAI, Type } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `
            The user is expressing the following feeling or situation: "${text}"
            Identify the core emotion or topic (e.g., "Grief", "Anxiety", "Doubt", "Heartbreak", "Anger").
            Provide a list of 5-8 related keywords (lowercase).
            Find exactly 3 comforting King James Version (KJV) Bible verses that address this feeling.
            Return ONLY valid JSON matching this schema:
            {
              "topic_name": "string",
              "keywords": ["string", "string"],
              "verses": [
                { "book": "string", "chapter": number, "verse": number }
              ]
            }
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          
          const aiData = JSON.parse(response.text || '{}');
          
          if (aiData.topic_name && aiData.verses && aiData.verses.length > 0) {
            // Harvest: Insert new topic
            const [topicResult] = await pool.query(
              'INSERT INTO topics (name, keywords) VALUES (?, ?)',
              [aiData.topic_name, (aiData.keywords || []).join(',').toLowerCase()]
            );
            const topicId = (topicResult as any).insertId;
            
            let harvestedVerses = [];

            // Harvest: Map verses to the new topic
            for (const v of aiData.verses) {
               const [rows] = await pool.query(`
                 SELECT v.id, b.name as book_name, v.chapter, v.verse, v.text 
                 FROM verses v 
                 JOIN books b ON v.book_id = b.id 
                 WHERE b.name = ? AND v.chapter = ? AND v.verse = ?
               `, [v.book, v.chapter, v.verse]);
               
               if ((rows as any[]).length > 0) {
                 const dbVerse = (rows as any[])[0];
                 await pool.query(
                   'INSERT IGNORE INTO verse_topics (topic_id, verse_id) VALUES (?, ?)',
                   [topicId, dbVerse.id]
                 );
                 harvestedVerses.push({
                   ...dbVerse,
                   topic_name: aiData.topic_name
                 });
               }
            }
            
            if (harvestedVerses.length > 0) {
              return res.json({ 
                success: true, 
                data: harvestedVerses, 
                message: "We found these verses specially for you.",
                prayer
              });
            }
          }
          throw new Error("AI did not return valid mapped verses");
        } catch (aiError) {
          console.error("AI Fallback failed (Circuit Breaker Tripped):", aiError);
          // Circuit Breaker Fallback
          const [fallbackVerses] = await pool.query(`
            SELECT v.id, b.name as book_name, v.chapter, v.verse, v.text, t.name as topic_name
            FROM verses v
            JOIN books b ON v.book_id = b.id
            JOIN verse_topics vt ON v.id = vt.verse_id
            JOIN topics t ON vt.topic_id = t.id
            WHERE t.name = 'Needing Direction' OR t.name = 'Fear'
            ORDER BY RAND()
            LIMIT 3
          `);
          return res.json({ 
            success: true, 
            data: fallbackVerses, 
            message: "We couldn't pinpoint a highly specific match right now, but these verses offer general comfort.",
            prayer
          });
        }
      }

      const topicIdsArray = Array.from(matchedTopicIds);
      const [verses] = await pool.query(`
        SELECT v.id, b.name as book_name, v.chapter, v.verse, v.text, t.name as topic_name
        FROM verses v
        JOIN books b ON v.book_id = b.id
        JOIN verse_topics vt ON v.id = vt.verse_id
        JOIN topics t ON vt.topic_id = t.id
        WHERE t.id IN (?)
      `, [topicIdsArray]);

      // Shuffle array and take top 5 to keep it fresh
      const versesArray = verses as any[];
      const shuffledVerses = versesArray.sort(() => 0.5 - Math.random()).slice(0, 5);

      res.json({ success: true, data: shuffledVerses, prayer });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  
  app.post('/api/summarize-notes', async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes || notes.length === 0) {
        return res.status(400).json({ error: 'No notes provided' });
      }

      let promptText = "Please review the following Bible verses and personal notes. Provide an uplifting and insightful summary of the themes and reflections in these notes. Structure it into a short pastoral letter or encouraging review. Start the letter with exactly 'AI Pastoral Word of Encouragement' on the first line. Do NOT use any markdown formatting symbols like '#', '*', or '_' anywhere in your response. You MUST sign the letter exactly with:\n\nGrace and peace,\nFaith Guidance\n\nDo not use any other signature.\n\n";
      notes.forEach((note, i) => {
        promptText += `Verse: ${note.bookName} ${note.chapter}:${note.verseNum} ("${note.text}")\n`;
        if (note.note) {
          promptText += `My Reflection: ${note.note}\n`;
        }
        promptText += "\n";
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ summary: "We could not generate a summary because the AI key is not configured. But remember, your personal reflections are a beautiful record of your journey!" });
      }
      
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: promptText,
      });

      res.json({ summary: response.text });
    } catch (error) {
      console.error('Error generating summary:', error);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });

  app.post('/api/translate-verses', async (req, res) => {
    try {
      const { verses, version } = req.body;
      if (!verses || !version || !Array.isArray(verses) || verses.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing verses or version' });
      }

      if (version === 'KJV') {
        return res.json({ success: true, data: verses });
      }

      const verseIds = verses.map(v => v.id);
      
      // 1. Check database for existing translations
      const [existingRows] = await pool.query(
        'SELECT verse_id, text FROM verse_translations WHERE version = ? AND verse_id IN (?)',
        [version, verseIds]
      );
      const existingMap = new Map();
      for (const row of (existingRows as any[])) {
        existingMap.set(row.verse_id, row.text);
      }

      // 2. Identify missing verses
      const missingVerses = verses.filter(v => !existingMap.has(v.id));

      // 3. Fetch missing verses if any
      if (missingVerses.length > 0) {
        // We can use bible-api.com for WEB and BBE to save Gemini calls completely
        if (version === 'WEB' || version === 'BBE') {
            for (const mv of missingVerses) {
                try {
                   const res = await fetch(`https://bible-api.com/${encodeURIComponent(mv.book_name)}%20${mv.chapter}:${mv.verse}?translation=${version.toLowerCase()}`);
                   if (res.ok) {
                       const data = await res.json();
                       if (data.text) {
                           existingMap.set(mv.id, data.text.trim());
                           await pool.query(
                               'INSERT IGNORE INTO verse_translations (verse_id, version, text) VALUES (?, ?, ?)',
                               [mv.id, version, data.text.trim()]
                           );
                       }
                   }
                } catch (e) { console.error('bible-api error', e); }
            }
        } else {
            // Use Gemini for BSB
            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const { GoogleGenAI, Type } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });

              let prompt = '';
              if (version === 'IMF') {
                // Fetch BSB translation for reference
                const [bsbRows] = await pool.query(
                  'SELECT verse_id, text FROM verse_translations WHERE version = "BSB" AND verse_id IN (?)',
                  [missingVerses.map(v => v.id)]
                );
                const bsbMap = new Map((bsbRows as any[]).map(r => [r.verse_id, r.text]));
                
                // Fetch chapter summary
                const bookId = missingVerses[0].book_id;
                const chapter = missingVerses[0].chapter;
                const [summaryRows] = await pool.query(
                  'SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?',
                  [bookId, chapter]
                );
                const summary = (summaryRows as any[]).length > 0 ? (summaryRows as any[])[0].summary : 'No summary available.';

                prompt = `You are translating Bible verses into a modern, novel-like narrative style, as part of the 'Inspire My Faith' (IMF) version. Make it engaging, relatable, and use United States English.
Here is the chapter summary to guide the context:
${summary}

Translate the following Berean Standard Bible (BSB) verses:
${missingVerses.map((v) => `${v.book_name} ${v.chapter}:${v.verse} (${bsbMap.get(v.id) || v.text})`).join('\n')}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.`;
              } else {
                prompt = `Provide the exact text for the following Bible verses in the ${version} translation.
Verses:
${missingVerses.map((v) => `${v.book_name} ${v.chapter}:${v.verse}`).join('\n')}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.`;
              }

              let translatedTexts = [];
              let retries = 2;
              let delay = 3000;
              while (retries > 0) {
                try {
                  const response = await ai.models.generateContent({
                    model: 'gemini-flash-lite-latest',
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      responseSchema: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.STRING
                        }
                      }
                    }
                  });
                  let rawText = response.text || '[]';
                  const arrayMatch = rawText.match(/\[[\s\S]*\]/);
                  if (arrayMatch) {
                    rawText = arrayMatch[0];
                  }
                  translatedTexts = JSON.parse(rawText);
                  await new Promise(res => setTimeout(res, 500));
                  break;
                } catch (err: any) {
                  const errStr = err.message || JSON.stringify(err);
                  console.error('Gemini error during live translation:', errStr);
                  
                  if (errStr.includes('GenerateRequestsPerDay') && errStr.includes('quotaId')) {
                    throw new Error('Daily Quota Exceeded. Try again tomorrow.');
                  }
                  
                  retries--;
                  if (retries === 0) {
                    console.log('Gemini live translate rate limit exceeded or failed, falling back to base text');
                    break;
                  }
                  
                  if (err.status === 429 || errStr.includes('429') || errStr.includes('Quota exceeded')) {
                    let waitTime = delay;
                    if (err.message) {
                      const match = err.message.match(/Please retry in ([\d.]+)s/);
                      if (match && match[1]) {
                        waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 1000;
                      }
                    }
                    if (waitTime > 10000) waitTime = 10000; // Cap wait time
                    console.log('Rate limited, waiting ' + waitTime + 'ms before retry...');
                    await new Promise(res => setTimeout(res, waitTime));
                  } else {
                    break;
                  }
                }
              }
              for (let i = 0; i < missingVerses.length; i++) {
                 if (translatedTexts[i]) {
                     existingMap.set(missingVerses[i].id, translatedTexts[i].trim());
                     await pool.query(
                         'INSERT IGNORE INTO verse_translations (verse_id, version, text) VALUES (?, ?, ?)',
                         [missingVerses[i].id, version, translatedTexts[i].trim()]
                     );
                 }
              }
            }
        }
      }

      // 4. Reconstruct the requested verses with translations
      const translatedVerses = verses.map(v => ({
          ...v,
          text: existingMap.get(v.id) || v.text // Fallback to original text if translation failed
      }));

      res.json({ success: true, data: translatedVerses });
    } catch (error: any) {
      console.error('Translation error:', error);
      res.status(500).json({ success: false, message: error.message || 'Translation failed' });
    }
  });

  interface ChapterBuild {
  chapter: number;
  status: 'pending' | 'checking' | 'building' | 'completed' | 'error';
  message: string;
}

let activeBuild = {
  active: false,
  bookId: 0,
  bookName: '',
  chapters: [] as ChapterBuild[],
  globalStatus: 'idle' as 'idle' | 'building' | 'waiting_quota' | 'completed',
  resumeAt: null as string | null,
  resumeTimer: null as any
};

  app.post('/api/admin/generate-verses', async (req, res) => {
    try {
      const { quantity, season, customTheme, model, apiKey } = req.body;
      const actualSeason = season === 'other' ? customTheme : season;
      const useModel = model || 'gemini-3.6-flash';
      const useKey = apiKey || process.env.GEMINI_API_KEY;

      if (!useKey) {
        return res.status(400).json({ success: false, message: 'No API key provided or configured.' });
      }
      
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: useKey });

      const schema = {
        type: Type.ARRAY,
        description: "List of Bible verses",
        items: {
          type: Type.OBJECT,
          properties: {
            reference: { type: Type.STRING, description: "Bible reference (e.g., John 3:16)" },
            verse_text: { type: Type.STRING, description: "The actual verse text" },
            make_it_happen: { type: Type.STRING, description: "A compelling, actionable reflection on the verse for the user" },
            season_tag: { type: Type.STRING, description: "The requested season or theme" }
          },
          required: ["reference", "verse_text", "make_it_happen", "season_tag"]
        }
      };

      const prompt = `Generate exactly ${quantity} highly inspiring, hand-picked Bible verses that fit the theme/season: "${actualSeason}". 
For each verse, provide the reference, the verse text, and a highly engaging "Make it happen" actionable reflection. The season_tag should be exactly "${actualSeason}". Make sure each verse is completely unique.`;

      const response = await ai.models.generateContent({
        model: useModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });

      const verses = JSON.parse(response.text || '[]');
      
      if (!verses || verses.length === 0) {
        throw new Error('Failed to parse generated verses');
      }

      // Format for bulk insert
      const values = verses.map((v: any) => [v.reference, v.verse_text, v.season_tag, v.make_it_happen]);
      
      await pool.query(
        'INSERT INTO daily_inspiration (reference, verse_text, season_tag, make_it_happen) VALUES ?',
        [values]
      );

      res.json({ success: true, count: verses.length });
    } catch (err: any) {
      console.error('Error generating verses:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get('/api/admin/batch-status', (req, res) => {
    res.json({
      active: activeBuild.active,
      bookId: activeBuild.bookId,
      bookName: activeBuild.bookName,
      chapters: activeBuild.chapters,
      globalStatus: activeBuild.globalStatus,
      resumeAt: activeBuild.resumeAt
    });
  });

  app.post('/api/admin/build-book', async (req, res) => {
    const { bookId, force } = req.body;
    if (activeBuild.active) {
      return res.status(400).json({ success: false, message: 'A book build is already in progress.' });
    }
    
    try {
      if (force) {
        // Wipe existing translations for this book so they get rebuilt
        await pool.query(
          'DELETE FROM verse_translations WHERE version = ? AND verse_id IN (SELECT id FROM verses WHERE book_id = ?)',
          ['IMF', bookId]
        );
      }

      const [books] = await pool.query('SELECT name FROM books WHERE id = ?', [bookId]);
      if ((books as any[]).length === 0) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
      
      const bookName = (books as any[])[0].name;
      
      const [chapters] = await pool.query('SELECT DISTINCT chapter FROM verses WHERE book_id = ? ORDER BY chapter ASC', [bookId]);
      
      activeBuild = {
        active: true,
        bookId: Number(bookId),
        bookName,
        chapters: (chapters as any[]).map(c => ({ chapter: c.chapter, status: 'pending', message: 'Pending' })),
        globalStatus: 'building',
        resumeAt: null,
        resumeTimer: null
      };
      
      // Start background process
      simulateBookBuild(Number(bookId));
      
      res.json({ success: true, message: 'Book build started.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Database error starting build.' });
    }
  });

  app.post('/api/admin/build-chapter', async (req, res) => {
    const { bookId, chapter } = req.body;
    if (activeBuild.active) {
      return res.status(400).json({ success: false, message: 'A book build is already in progress.' });
    }
    
    try {
      // Wipe existing translations for this chapter so they get rebuilt
      await pool.query(
        'DELETE FROM verse_translations WHERE version = ? AND verse_id IN (SELECT id FROM verses WHERE book_id = ? AND chapter = ?)',
        ['IMF', bookId, chapter]
      );

      const [books] = await pool.query('SELECT name FROM books WHERE id = ?', [bookId]);
      if ((books as any[]).length === 0) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
      
      const bookName = (books as any[])[0].name;
      
      activeBuild = {
        active: true,
        bookId: Number(bookId),
        bookName,
        chapters: [{ chapter: Number(chapter), status: 'pending', message: 'Pending' }],
        globalStatus: 'building',
        resumeAt: null,
        resumeTimer: null
      };
      
      // Start background process
      simulateBookBuild(Number(bookId));
      
      res.json({ success: true, message: 'Chapter build started.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Database error starting build.' });
    }
  });

  app.post('/api/admin/stop-build', (req, res) => {
    if (activeBuild.resumeTimer) {
      clearTimeout(activeBuild.resumeTimer);
    }
    activeBuild.active = false;
    activeBuild.globalStatus = 'idle';
    activeBuild.resumeAt = null;
    res.json({ success: true });
  });

  async function simulateBookBuild(bookId: number) {
    if (!activeBuild.active || activeBuild.bookId !== bookId) return;
    
    try {
      for (let chIdx = 0; chIdx < activeBuild.chapters.length; chIdx++) {
        if (!activeBuild.active) break;
        
        const chapObj = activeBuild.chapters[chIdx];
        if (chapObj.status === 'completed') continue;
        
        const updateChapStatus = (status: ChapterBuild['status'], msg: string) => {
           chapObj.status = status;
           chapObj.message = msg;
        };
        
        updateChapStatus('checking', 'Checking existing translations');
        
        // Fetch verses for this chapter
        const [verses] = await pool.query(
          'SELECT v.*, b.name as book_name FROM verses v JOIN books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter = ? ORDER BY v.verse ASC',
          [bookId, chapObj.chapter]
        );
        
        // Check for missing IMF translations
        const verseIds = (verses as any[]).map(v => v.id);
        const [existingRows] = await pool.query(
          'SELECT verse_id FROM verse_translations WHERE version = ? AND verse_id IN (?)',
          ['IMF', verseIds]
        );
        const existingIds = new Set((existingRows as any[]).map(r => r.verse_id));
        const missingVerses = (verses as any[]).filter(v => !existingIds.has(v.id));
        
        if (missingVerses.length === 0) {
           updateChapStatus('completed', 'All verses translated');
           continue;
        }
        
        updateChapStatus('building', 'Translating verses with Gemini');
        
        const apiKey = process.env.GEMINI_BUILDER_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey) {
          const { GoogleGenAI, Type } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey });
          
          const [bsbRows] = await pool.query(
            'SELECT verse_id, text FROM verse_translations WHERE version = "BSB" AND verse_id IN (?)',
            [missingVerses.map(v => v.id)]
          );
          const bsbMap = new Map((bsbRows as any[]).map(r => [r.verse_id, r.text]));
          
          const [summaryRows] = await pool.query(
            'SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?',
            [bookId, chapObj.chapter]
          );
          const summary = (summaryRows as any[]).length > 0 ? (summaryRows as any[])[0].summary : 'No summary available.';

          const prompt = `You are translating Bible verses into a modern, novel-like narrative style, as part of the 'Inspire My Faith' (IMF) version. Make it engaging, relatable, and use United States English.
Here is the chapter summary to guide the context:
${summary}

Translate the following Berean Standard Bible (BSB) verses:
${missingVerses.map((v) => `${v.book_name} ${v.chapter}:${v.verse} (${bsbMap.get(v.id) || v.text})`).join('\n')}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.`;
          
          let translatedTexts: string[] = [];
          let retries = 50;
          let succeeded = false;
          let quotaHit = false;
          
          while (retries > 0) {
            if (!activeBuild.active) break;
            try {
              const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              });
              let rawText = response.text || '[]';
              const arrayMatch = rawText.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                rawText = arrayMatch[0];
              }
              translatedTexts = JSON.parse(rawText);
              succeeded = true;
              break;
            } catch (err: any) {
              retries--;
              if (retries === 0) {
                console.log('Book build skipped chapter after retries:', activeBuild.bookName, chapObj.chapter);
                updateChapStatus('error', 'Failed after max retries');
                break;
              }
              
              const errString = err.message || JSON.stringify(err);
              if (errString.includes('GenerateRequestsPerDay') && errString.includes('quotaId')) {
                 quotaHit = true;
                 break;
              }
              
              let waitTime = 20000; // Default 20s wait
              if (err.message) {
                const match = err.message.match(/Please retry in ([\d.]+)s/);
                if (match && match[1]) {
                  waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
                }
              }
              
              // Wait in chunks of 1 second
              for(let w = Math.ceil(waitTime / 1000); w > 0; w--) {
                 if (!activeBuild.active) break;
                 updateChapStatus('building', `Rate limited, retrying in ${w}s...`);
                 await new Promise(res => setTimeout(res, 1000));
              }
            }
          }
          
          if (quotaHit) {
            updateChapStatus('pending', 'Waiting for daily quota reset');
            activeBuild.globalStatus = 'waiting_quota';
            // Schedule resume in 24 hours (86400000 ms)
            const waitMs = 24 * 60 * 60 * 1000;
            activeBuild.resumeAt = new Date(Date.now() + waitMs).toISOString();
            
            activeBuild.resumeTimer = setTimeout(() => {
              activeBuild.globalStatus = 'building';
              activeBuild.resumeAt = null;
              activeBuild.resumeTimer = null;
              simulateBookBuild(bookId);
            }, waitMs);
            return; // Exit loop, we'll resume later
          }
          
          if (succeeded && activeBuild.active) {
             updateChapStatus('building', 'Writing to MySQL');
             for (let j = 0; j < missingVerses.length; j++) {
                if (translatedTexts[j]) {
                    await pool.query(
                        'INSERT IGNORE INTO verse_translations (verse_id, version, text) VALUES (?, ?, ?)',
                        [missingVerses[j].id, 'IMF', translatedTexts[j].trim()]
                    );
                }
             }
             updateChapStatus('completed', 'Finished');
             // Pause 6 seconds before next chapter to stay well under 15 RPM
             for(let w = 6; w > 0; w--) {
               if (!activeBuild.active) break;
               updateChapStatus('completed', `Next chapter in ${w}s...`);
               await new Promise(res => setTimeout(res, 1000));
             }
             updateChapStatus('completed', 'Finished');
          }
        }
      }
      
      if (activeBuild.active && activeBuild.globalStatus === 'building') {
        const allCompleted = activeBuild.chapters.every(c => c.status === 'completed');
        if (allCompleted) {
          activeBuild.globalStatus = 'completed';
          activeBuild.active = false;
        }
      }
      
    } catch (err) {
      console.error('Book build error:', err);
      if (activeBuild.active) {
         activeBuild.globalStatus = 'idle';
         activeBuild.active = false;
      }
    }
  }

  app.get('/api/admin/stats', async (req, res) => {
    try {
      const [topicCountResult] = await pool.query('SELECT COUNT(*) as count FROM topics');
      const [mappingCountResult] = await pool.query('SELECT COUNT(*) as count FROM verse_topics');
      
      const topicCount = (topicCountResult as any[])[0].count;
      const mappingCount = (mappingCountResult as any[])[0].count;
      
      res.json({ success: true, data: { topicCount, mappingCount } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.get('/api/admin/recent-topics', async (req, res) => {
    try {
      const [topics] = await pool.query(`
        SELECT t.id, t.name, t.keywords, COUNT(vt.verse_id) as verse_count
        FROM topics t
        LEFT JOIN verse_topics vt ON t.id = vt.topic_id
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 20
      `);
      res.json({ success: true, data: topics });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  // -- Admin User Management --
  app.get('/api/admin/users', async (req, res) => {
    try {
      const [users] = await pool.query('SELECT email, created_at FROM admin_users ORDER BY created_at ASC');
      res.json({ success: true, data: users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
    try {
      const { email, reqEmail } = req.body;
      if (!email || !reqEmail) return res.status(400).json({ success: false, message: 'Missing email' });
      
      // Verify requester is super admin
      if (reqEmail !== 'daveward.us@gmail.com') {
        return res.status(403).json({ success: false, message: 'Only daveward.us@gmail.com can add admins.' });
      }

      await pool.query('INSERT IGNORE INTO admin_users (email) VALUES (?)', [email]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.delete('/api/admin/users/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const { reqEmail } = req.query;
      
      if (!reqEmail) return res.status(400).json({ success: false, message: 'Missing requester email' });
      
      if (reqEmail !== 'daveward.us@gmail.com') {
        return res.status(403).json({ success: false, message: 'Only daveward.us@gmail.com can delete admins.' });
      }

      if (email === 'daveward.us@gmail.com') {
        return res.status(400).json({ success: false, message: 'Cannot delete super admin.' });
      }

      await pool.query('DELETE FROM admin_users WHERE email = ?', [email]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.get('/api/admin/check', async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.json({ success: false, isAdmin: false });
      if (email === 'daveward.us@gmail.com') return res.json({ success: true, isAdmin: true, isSuperAdmin: true });
      
      const [rows] = await pool.query('SELECT email FROM admin_users WHERE email = ?', [email]);
      if ((rows as any[]).length > 0) {
        return res.json({ success: true, isAdmin: true, isSuperAdmin: false });
      }
      return res.json({ success: true, isAdmin: false, isSuperAdmin: false });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, isAdmin: false });
    }
  });

  // -- Verse Update (Editor Tab) --
  app.get('/api/admin/verse-translation/:bookId/:chapter/:verseNum', async (req, res) => {
    try {
      const { bookId, chapter, verseNum } = req.params;
      const [verseRows] = await pool.query(
        'SELECT id, text as base_text FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verseNum]
      );
      if ((verseRows as any[]).length === 0) {
        return res.status(404).json({ success: false, message: 'Verse not found' });
      }
      const verseId = (verseRows as any[])[0].id;
      const baseText = (verseRows as any[])[0].base_text;

      const [transRows] = await pool.query(
        'SELECT text FROM verse_translations WHERE verse_id = ? AND version = "IMF"',
        [verseId]
      );

      const imfText = (transRows as any[]).length > 0 ? (transRows as any[])[0].text : '';

      res.json({ success: true, baseText, imfText });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/admin/regenerate-verse', async (req, res) => {
    try {
      const { bookId, chapter, verseNum } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ success: false, message: 'Missing Gemini API Key' });

      // Fetch the target verse, previous verse, and next verse to provide context
      const prev = Number(verseNum) - 1;
      const next = Number(verseNum) + 1;
      
      const [contextRows] = await pool.query(
        `SELECT v.verse, v.text as base_text, vt.text as imf_text 
         FROM verses v 
         LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
         WHERE v.book_id = ? AND v.chapter = ? AND v.verse IN (?, ?, ?) 
         ORDER BY v.verse ASC`,
         [bookId, chapter, prev, verseNum, next]
      );

      const rows = contextRows as any[];
      const targetVerse = rows.find(r => r.verse === Number(verseNum));
      if (!targetVerse) return res.status(404).json({ success: false, message: 'Verse not found' });

      const prevVerse = rows.find(r => r.verse === prev);
      const nextVerse = rows.find(r => r.verse === next);

      let contextStr = '';
      if (prevVerse) contextStr += `Previous Verse (${prevVerse.verse}): ${prevVerse.imf_text || prevVerse.base_text}\n`;
      contextStr += `Target Verse (${targetVerse.verse}): ${targetVerse.base_text}\n`;
      if (nextVerse) contextStr += `Next Verse (${nextVerse.verse}): ${nextVerse.imf_text || nextVerse.base_text}\n`;

      const genAI = new GoogleGenAI({ apiKey });
      const prompt = `You are translating the Bible into the "Inspire My Faith Modern Version".
This translation should be easily readable for modern readers, utilizing contemporary English without compromising the theological depth or core meaning. Ensure the tone remains reverent and deeply engaging.

Here are some surrounding verses for context so that your translation flows naturally and matches the writing style:
${contextStr}

Please translate the Target Verse (${targetVerse.verse}) into the Inspire My Faith Modern Version style.
Provide ONLY the translated text for the Target Verse. Do not include verse numbers or any conversational text.`;

      const result = await genAI.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
      });
      
      const text = result.text.trim();
      res.json({ success: true, text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to regenerate verse' });
    }
  });
  app.put('/api/admin/verse-translation', async (req, res) => {
    try {
      const { bookId, chapter, verseNum, version, text, email } = req.body;
      if (!email || !bookId || !chapter || !verseNum || !version || !text) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
      }
      
      // Basic check
      if (email !== 'daveward.us@gmail.com') {
         const [rows] = await pool.query('SELECT email FROM admin_users WHERE email = ?', [email]);
         if ((rows as any[]).length === 0) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
         }
      }

      // get verse_id
      const [verseRows] = await pool.query(
        'SELECT id FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verseNum]
      );
      if ((verseRows as any[]).length === 0) {
        return res.status(404).json({ success: false, message: 'Verse not found' });
      }
      const verseId = (verseRows as any[])[0].id;
      
      await pool.query(
        `INSERT INTO verse_translations (verse_id, version, text) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE text=VALUES(text)`,
        [verseId, version, text]
      );

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });


  // -- Saved Verses (MySQL) --
  app.get('/api/user/verses/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT v.*, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections
        FROM user_saved_verses v
        LEFT JOIN user_verse_collections vc ON v.id = vc.verse_id AND vc.user_id = v.user_id
        WHERE v.user_id = ?
        GROUP BY v.id
        ORDER BY v.is_pinned DESC, v.saved_at DESC
      `, [req.params.userId]);
      // Map back to camelCase for the frontend
      const verses = (rows as any[]).map(row => ({
        id: row.id,
        bookName: row.book_name,
        chapter: row.chapter,
        verseNum: row.verse_num,
        text: row.text,
        version: row.version,
        note: row.note || '',
        savedAt: row.saved_at,
        isPinned: row.is_pinned === 1,
        isMemorized: row.is_memorized === 1,
        collections: row.collections ? row.collections.split('|||') : []
      }));
      res.json({ success: true, data: verses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/user/verses', async (req, res) => {
    try {
      const { userId, verse } = req.body;
      if (!userId || !verse) return res.status(400).json({ success: false });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO user_saved_verses 
            (id, user_id, book_name, chapter, verse_num, text, version, note, saved_at, is_pinned, is_memorized) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE text=VALUES(text), note=VALUES(note), is_pinned=VALUES(is_pinned), is_memorized=VALUES(is_memorized)`,
          [
            verse.id, userId, verse.bookName, verse.chapter, verse.verseNum, 
            verse.text, verse.version, verse.note || '', verse.savedAt || Date.now(),
            verse.isPinned ? 1 : 0, verse.isMemorized ? 1 : 0
          ]
        );
        await connection.query('DELETE FROM user_verse_collections WHERE verse_id = ? AND user_id = ?', [verse.id, userId]);
        if (verse.collections && verse.collections.length > 0) {
          const values = verse.collections.map((c: string) => [verse.id, userId, c]);
          await connection.query('INSERT INTO user_verse_collections (verse_id, user_id, collection_name) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.put('/api/user/verses/:verseId/note', async (req, res) => {
    try {
      const { userId, note } = req.body;
      await pool.query(
        'UPDATE user_saved_verses SET note = ? WHERE id = ? AND user_id = ?',
        [note, req.params.verseId, userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.delete('/api/user/verses/:verseId', async (req, res) => {
    try {
      const { userId } = req.query;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          'DELETE FROM user_saved_verses WHERE id = ? AND user_id = ?',
          [req.params.verseId, userId]
        );
        await connection.query('DELETE FROM user_verse_collections WHERE verse_id = ? AND user_id = ?', [req.params.verseId, userId]);
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });
  
  // -- Faith Verses (MySQL) --
  app.get('/api/user/faith-verses/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT v.*, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections
        FROM user_faith_verses v
        LEFT JOIN user_faith_verse_collections vc ON v.id = vc.verse_id
        WHERE v.user_id = ?
        GROUP BY v.id
        ORDER BY v.is_pinned DESC, v.saved_at DESC
      `, [req.params.userId]);
      // Map back to camelCase for the frontend
      const verses = (rows as any[]).map(row => ({
        id: row.id,
        bookName: row.book_name,
        chapter: row.chapter,
        verseNum: row.verse_num,
        text: row.text,
        version: row.version,
        note: row.note || '',
        savedAt: row.saved_at,
        isPinned: row.is_pinned === 1,
        isMemorized: row.is_memorized === 1,
        collections: row.collections ? row.collections.split('|||') : []
      }));
      res.json({ success: true, data: verses });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/user/faith-verses', async (req, res) => {
    try {
      const { userId, verse } = req.body;
      if (!userId || !verse) return res.status(400).json({ success: false });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO user_faith_verses 
            (id, user_id, book_name, chapter, verse_num, text, version, note, saved_at, is_pinned, is_memorized) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE text=VALUES(text), note=VALUES(note), is_pinned=VALUES(is_pinned), is_memorized=VALUES(is_memorized)`,
          [
            verse.id, userId, verse.bookName, verse.chapter, verse.verseNum, 
            verse.text, verse.version, verse.note || '', verse.savedAt || Date.now(),
            verse.isPinned ? 1 : 0, verse.isMemorized ? 1 : 0
          ]
        );
        await connection.query('DELETE FROM user_faith_verse_collections WHERE verse_id = ?', [verse.id]);
        if (verse.collections && verse.collections.length > 0) {
          const values = verse.collections.map((c: string) => [verse.id, c]);
          await connection.query('INSERT INTO user_faith_verse_collections (verse_id, collection_name) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error: any) {
      console.error(error);
      try {
        fs.appendFileSync('db-errors.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\\n');
      } catch (e) {}
      res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
  });

  app.put('/api/user/faith-verses/:verseId/note', async (req, res) => {
    try {
      const { userId, note } = req.body;
      await pool.query(
        'UPDATE user_faith_verses SET note = ? WHERE id = ? AND user_id = ?',
        [note, req.params.verseId, userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.delete('/api/user/faith-verses/:verseId', async (req, res) => {
    try {
      const { userId } = req.query;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          'DELETE FROM user_faith_verses WHERE id = ? AND user_id = ?',
          [req.params.verseId, userId]
        );
        await connection.query('DELETE FROM user_faith_verse_collections WHERE verse_id = ? AND user_id = ?', [req.params.verseId, userId]);
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  // -- Bookmarks (MySQL) --
  app.get('/api/user/bookmarks/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
        [req.params.userId]
      );
      const bookmarks = (rows as any[]).map(row => ({
        id: row.id,
        bookName: row.book_name,
        chapter: row.chapter,
        verseNum: row.verse_num,
        text: row.text,
        version: row.version,
        timestamp: row.timestamp
      }));
      res.json({ success: true, data: bookmarks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.post('/api/user/bookmarks', async (req, res) => {
    try {
      const { userId, bookmark } = req.body;
      if (!userId || !bookmark) return res.status(400).json({ success: false });

      await pool.query(
        `INSERT INTO user_bookmarks 
          (id, user_id, book_name, chapter, verse_num, text, version, timestamp) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp)`,
        [
          bookmark.id, userId, bookmark.bookName, bookmark.chapter, bookmark.verseNum, 
          bookmark.text, bookmark.version, bookmark.timestamp || Date.now()
        ]
      );

      // Delete older bookmarks beyond the top 5
      await pool.query(
        `DELETE FROM user_bookmarks 
         WHERE user_id = ? 
         AND id NOT IN (
           SELECT id FROM (
             SELECT id FROM user_bookmarks 
             WHERE user_id = ? 
             ORDER BY timestamp DESC 
             LIMIT 5
           ) as subquery
         )`,
        [userId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });

  app.delete('/api/user/bookmarks/:verseId', async (req, res) => {
    try {
      const { userId } = req.query;
      await pool.query(
        'DELETE FROM user_bookmarks WHERE id = ? AND user_id = ?',
        [req.params.verseId, userId]
      );
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Database error' });
    }
  });


  // -- Prayers (MySQL) --
  app.get('/api/user/prayers/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections
        FROM user_prayers p
        LEFT JOIN user_prayer_collections pc ON p.id = pc.prayer_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.is_pinned DESC, p.timestamp DESC
      `, [req.params.userId]);
      const prayers = (rows as any[]).map(row => ({
        id: row.id, title: row.title, text: row.text, answered: row.answered === 1, timestamp: row.timestamp, isPinned: row.is_pinned === 1, reflection: row.reflection || '',
        collections: row.collections ? row.collections.split('|||') : []
      }));
      res.json({ success: true, data: prayers });
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.post('/api/user/prayers', async (req, res) => {
    try {
      const { userId, prayer } = req.body;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          'INSERT INTO user_prayers (id, user_id, title, text, answered, timestamp, is_pinned, reflection) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), text=VALUES(text), answered=VALUES(answered), timestamp=VALUES(timestamp), is_pinned=VALUES(is_pinned), reflection=VALUES(reflection)',
          [prayer.id, userId, prayer.title, prayer.text, prayer.answered ? 1 : 0, prayer.timestamp || Date.now(), prayer.isPinned ? 1 : 0, prayer.reflection || '']
        );
        await connection.query('DELETE FROM user_prayer_collections WHERE prayer_id = ?', [prayer.id]);
        if (prayer.collections && prayer.collections.length > 0) {
          const values = prayer.collections.map((c: string) => [prayer.id, c]);
          await connection.query('INSERT INTO user_prayer_collections (prayer_id, collection_name) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.delete('/api/user/prayers/:prayerId', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_prayers WHERE id = ? AND user_id = ?', [req.params.prayerId, req.query.userId]);
        await connection.query('DELETE FROM user_prayer_collections WHERE prayer_id = ?', [req.params.prayerId]);
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  // -- Reading Plans (MySQL) --
  app.get('/api/user/reading-plans/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM user_reading_plans WHERE user_id = ?', [req.params.userId]);
      const plans = (rows as any[]).map(row => ({
        id: row.id, planName: row.plan_name, progress: row.progress, totalDays: row.total_days, lastReadTimestamp: row.last_read_timestamp, streak: row.streak
      }));
      res.json({ success: true, data: plans });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.post('/api/user/reading-plans', async (req, res) => {
    try {
      const { userId, plan } = req.body;
      await pool.query(
        'INSERT INTO user_reading_plans (id, user_id, plan_name, progress, total_days, last_read_timestamp, streak) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE progress=VALUES(progress), last_read_timestamp=VALUES(last_read_timestamp), streak=VALUES(streak)',
        [plan.id, userId, plan.planName, plan.progress, plan.totalDays, plan.lastReadTimestamp, plan.streak]
      );
      res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  // -- Collection Settings (MySQL) --
  app.get('/api/user/collections/settings/:sectionType/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT collection_name, color, icon, description, is_pinned, created_at FROM user_collection_settings WHERE user_id = ? AND section_type = ?', [req.params.userId, req.params.sectionType]);
      const settings = (rows as any[]).reduce((acc, row) => {
        acc[row.collection_name] = {
          color: row.color,
          icon: row.icon || 'FolderOpen',
          description: row.description || '',
          isPinned: row.is_pinned === 1,
          createdAt: row.created_at || new Date().toISOString()
        };
        return acc;
      }, {} as Record<string, any>);
      res.json({ success: true, data: settings });
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.post('/api/user/collections/settings', async (req, res) => {
    try {
      const { userId, sectionType, collectionName, settings } = req.body;
      await pool.query(
        'INSERT INTO user_collection_settings (user_id, collection_name, section_type, color, icon, description, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE color = VALUES(color), icon = VALUES(icon), description = VALUES(description), is_pinned = VALUES(is_pinned)',
        [userId, collectionName, sectionType || 'verse', settings.color || '#c2094c', settings.icon || 'FolderOpen', settings.description || '', settings.isPinned ? 1 : 0]
      );
      res.json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.post('/api/user/collections/rename', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId, sectionType, oldName, newName } = req.body;
      if (!userId || !oldName || !newName || !sectionType) return res.status(400).json({ success: false });

      await connection.beginTransaction();

      await connection.query('UPDATE user_collection_settings SET collection_name = ? WHERE collection_name = ? AND user_id = ? AND section_type = ?', [newName, oldName, userId, sectionType]);
      if (sectionType === 'verse') {
        await connection.query('UPDATE user_verse_collections SET collection_name = ? WHERE collection_name = ? AND user_id = ?', [newName, oldName, userId]);
      } else if (sectionType === 'prayer') {
        await connection.query('UPDATE user_prayer_collections upc JOIN user_prayers up ON upc.prayer_id = up.id SET upc.collection_name = ? WHERE upc.collection_name = ? AND up.user_id = ?', [newName, oldName, userId]);
      } else if (sectionType === 'note') {
        await connection.query('UPDATE user_note_collections unc JOIN user_sermon_notes usn ON unc.note_id = usn.id SET unc.collection_name = ? WHERE unc.collection_name = ? AND usn.user_id = ?', [newName, oldName, userId]);
      } else if (sectionType === 'prompt') {
        await connection.query('UPDATE user_prompt_collections upc JOIN user_saved_prompts usp ON upc.prompt_id = usp.id SET upc.collection_name = ? WHERE upc.collection_name = ? AND usp.user_id = ?', [newName, oldName, userId]);
      }

      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      console.error(error); 
      res.status(500).json({ success: false }); 
    } finally {
      connection.release();
    }
  });

  app.post('/api/user/collections/delete', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { userId, sectionType, collectionName } = req.body;
      if (!userId || !collectionName || !sectionType) return res.status(400).json({ success: false });

      await connection.beginTransaction();

      await connection.query('DELETE FROM user_collection_settings WHERE collection_name = ? AND user_id = ? AND section_type = ?', [collectionName, userId, sectionType]);
      if (sectionType === 'verse') {
        await connection.query('DELETE FROM user_verse_collections WHERE collection_name = ? AND user_id = ?', [collectionName, userId]);
      } else if (sectionType === 'prayer') {
        await connection.query('DELETE upc FROM user_prayer_collections upc JOIN user_prayers up ON upc.prayer_id = up.id WHERE upc.collection_name = ? AND up.user_id = ?', [collectionName, userId]);
      } else if (sectionType === 'note') {
        await connection.query('DELETE unc FROM user_note_collections unc JOIN user_sermon_notes usn ON unc.note_id = usn.id WHERE unc.collection_name = ? AND usn.user_id = ?', [collectionName, userId]);
      } else if (sectionType === 'prompt') {
        await connection.query('DELETE upc FROM user_prompt_collections upc JOIN user_saved_prompts usp ON upc.prompt_id = usp.id WHERE upc.collection_name = ? AND usp.user_id = ?', [collectionName, userId]);
      }

      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      console.error(error); 
      res.status(500).json({ success: false }); 
    } finally {
      connection.release();
    }
  });

  // -- Sermon Notes (MySQL) --
  app.get('/api/user/sermon-notes/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT sn.*, GROUP_CONCAT(nc.collection_name SEPARATOR '|||') as collections
        FROM user_sermon_notes sn
        LEFT JOIN user_note_collections nc ON sn.id = nc.note_id
        WHERE sn.user_id = ?
        GROUP BY sn.id
        ORDER BY sn.is_pinned DESC, sn.timestamp DESC
      `, [req.params.userId]);
      const notes = (rows as any[]).map(row => ({
        id: row.id, title: row.title, speaker: row.speaker, date: row.date, text: row.notes, timestamp: row.timestamp, isPinned: row.is_pinned === 1,
        collections: row.collections ? row.collections.split('|||') : []
      }));
      res.json({ success: true, data: notes });
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.post('/api/user/sermon-notes', async (req, res) => {
    try {
      const { userId, note } = req.body;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          'INSERT INTO user_sermon_notes (id, user_id, title, speaker, date, notes, timestamp, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), speaker=VALUES(speaker), date=VALUES(date), notes=VALUES(notes), timestamp=VALUES(timestamp), is_pinned=VALUES(is_pinned)',
          [note.id, userId, note.title, note.speaker, note.date, note.text, note.timestamp || Date.now(), note.isPinned ? 1 : 0]
        );
        await connection.query('DELETE FROM user_note_collections WHERE note_id = ?', [note.id]);
        if (note.collections && note.collections.length > 0) {
          const values = note.collections.map((c: string) => [note.id, c]);
          await connection.query('INSERT INTO user_note_collections (note_id, collection_name) VALUES ?', [values]);
        }
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.delete('/api/user/sermon-notes/:noteId', async (req, res) => {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM user_sermon_notes WHERE id = ? AND user_id = ?', [req.params.noteId, req.query.userId]);
        await connection.query('DELETE FROM user_note_collections WHERE note_id = ?', [req.params.noteId]);
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  // -- Saved Prompts (MySQL) --
  app.get('/api/user/saved-prompts/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections
        FROM user_saved_prompts p
        LEFT JOIN user_prompt_collections pc ON p.id = pc.prompt_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.timestamp DESC
      `, [req.params.userId]);
      const prompts = (rows as any[]).map(row => ({
        id: row.id,
        title: row.title,
        text: row.text,
        answered: !!row.answered,
        timestamp: row.timestamp,
        isPinned: !!row.isPinned,
        reflection: row.reflection,
        collections: row.collections ? row.collections.split('|||') : [],
        verses: row.verses ? (typeof row.verses === 'string' ? JSON.parse(row.verses) : row.verses) : []
      }));
      res.json({ success: true, data: prompts });
    } catch (error) { 
      console.error(error);
      res.status(500).json({ success: false }); 
    }
  });

  app.post('/api/user/saved-prompts', async (req, res) => {
    try {
      const { userId, prompt } = req.body;
      const collectionsJson = JSON.stringify(prompt.collections || []);
      const versesJson = JSON.stringify(prompt.verses || []);
      
      await pool.query(
        'INSERT INTO user_saved_prompts (id, user_id, title, text, answered, timestamp, isPinned, reflection, collections, verses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), text=VALUES(text), answered=VALUES(answered), timestamp=VALUES(timestamp), isPinned=VALUES(isPinned), reflection=VALUES(reflection), collections=VALUES(collections), verses=VALUES(verses)',
        [prompt.id, userId, prompt.title, prompt.text, prompt.answered ? 1 : 0, prompt.timestamp || Date.now(), prompt.isPinned ? 1 : 0, prompt.reflection || null, collectionsJson, versesJson]
      );
      res.json({ success: true });
    } catch (error) { 
      console.error(error);
      res.status(500).json({ success: false }); 
    }
  });

  app.delete('/api/user/saved-prompts/:promptId', async (req, res) => {
    try {
      await pool.query('DELETE FROM user_saved_prompts WHERE id = ? AND user_id = ?', [req.params.promptId, req.query.userId]);
      await pool.query('DELETE FROM user_prompt_collections WHERE prompt_id = ?', [req.params.promptId]);
      res.json({ success: true });
    } catch (error) { 
      console.error(error);
      res.status(500).json({ success: false }); 
    }
  });

  // -- Faith Events (MySQL) --
  app.get('/api/user/faith-events/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM user_faith_events WHERE user_id = ? ORDER BY timestamp DESC', [req.params.userId]);
      const events = (rows as any[]).map(row => ({
        id: row.id, eventType: row.event_type, title: row.title, description: row.description, timestamp: row.timestamp
      }));
      res.json({ success: true, data: events });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.post('/api/user/faith-events', async (req, res) => {
    try {
      const { userId, event } = req.body;
      await pool.query(
        'INSERT INTO user_faith_events (id, user_id, event_type, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), timestamp=VALUES(timestamp)',
        [event.id, userId, event.eventType, event.title, event.description, event.timestamp || Date.now()]
      );
      res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.delete('/api/user/faith-events/:eventId', async (req, res) => {
    try {
      await pool.query('DELETE FROM user_faith_events WHERE id = ? AND user_id = ?', [req.params.eventId, req.query.userId]);
      res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  // -- Master Timeline (MySQL) --
  app.get('/api/user/timeline/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      const [prayersRows] = await pool.query(`
        SELECT p.id, 'prayer' as type, p.title, p.text as description, p.timestamp, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections 
        FROM user_prayers p LEFT JOIN user_prayer_collections pc ON p.id = pc.prayer_id 
        WHERE p.user_id = ? GROUP BY p.id`, [userId]);
        
      const [notesRows] = await pool.query(`
        SELECT sn.id, 'note' as type, sn.title, sn.notes as description, sn.timestamp, GROUP_CONCAT(nc.collection_name SEPARATOR '|||') as collections 
        FROM user_sermon_notes sn LEFT JOIN user_note_collections nc ON sn.id = nc.note_id 
        WHERE sn.user_id = ? GROUP BY sn.id`, [userId]);
        
      const [versesRows] = await pool.query(`
        SELECT v.id, 'verse' as type, v.version, CONCAT(v.book_name, ' ', v.chapter, ':', v.verse_num) as title, v.text as description, v.note, v.saved_at as timestamp, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections 
        FROM user_faith_verses v LEFT JOIN user_faith_verse_collections vc ON v.id = vc.verse_id 
        WHERE v.user_id = ? GROUP BY v.id`, [userId]);
        
      const [bookmarksRows] = await pool.query(`
        SELECT b.id, 'bookmark' as type, CONCAT(b.book_name, ' ', b.chapter, ':', b.verse_num) as title, b.text as description, b.timestamp, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections 
        FROM user_bookmarks b LEFT JOIN user_verse_collections vc ON b.id = vc.verse_id 
        WHERE b.user_id = ? GROUP BY b.id`, [userId]);
        
      const [eventsRows] = await pool.query(`
        SELECT id, event_type as type, title, description, timestamp 
        FROM user_faith_events 
        WHERE user_id = ?`, [userId]);

      const [promptsRows] = await pool.query(`
        SELECT p.id, 'prompt' as type, p.title, p.text as description, p.timestamp, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections 
        FROM user_saved_prompts p LEFT JOIN user_prompt_collections pc ON p.id = pc.prompt_id 
        WHERE p.user_id = ? GROUP BY p.id`, [userId]);

      const formatRow = (row: any) => ({
        ...row,
        collections: row.collections ? row.collections.split('|||') : []
      });

      const timeline = [
        ...(prayersRows as any[]).map(formatRow),
        ...(notesRows as any[]).map(formatRow),
        ...(versesRows as any[]).map(formatRow),
        ...(bookmarksRows as any[]).map(formatRow),
        ...(eventsRows as any[]).map(formatRow),
        ...(promptsRows as any[]).map(formatRow)
      ].sort((a, b) => b.timestamp - a.timestamp);

      res.json({ success: true, data: timeline });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  });

  // -- Collections (MySQL) --
  app.get('/api/user/collections/:userId', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
      res.json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.post('/api/user/:sectionType/collections', async (req, res) => {
    try {
      const { userId, collectionName, items } = req.body;
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of items) {
          if (item.type === 'prayer' || item.type === 'prayer_answered') {
             await connection.query('INSERT IGNORE INTO user_prayer_collections (prayer_id, collection_name) VALUES (?, ?)', [item.id, collectionName]);
          } else if (item.type === 'note') {
             await connection.query('INSERT IGNORE INTO user_note_collections (note_id, collection_name) VALUES (?, ?)', [item.id, collectionName]);
          } else if (item.type === 'verse' || item.type === 'bookmark') {
             await connection.query('INSERT IGNORE INTO user_verse_collections (verse_id, user_id, collection_name) VALUES (?, ?, ?)', [item.id, userId, collectionName]);
          } else if (item.type === 'prompt') {
             await connection.query('INSERT IGNORE INTO user_prompt_collections (prompt_id, collection_name) VALUES (?, ?)', [item.id, collectionName]);
          }
        }
        await connection.commit();
        res.json({ success: true });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
  });

  app.get('/api/user/:sectionType/collections/counts/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [prayers] = await pool.query(`
        SELECT upc.collection_name, COUNT(*) as count 
        FROM user_prayer_collections upc 
        JOIN user_prayers up ON upc.prayer_id = up.id 
        WHERE up.user_id = ? GROUP BY upc.collection_name
      `, [userId]);
      
      const [notes] = await pool.query(`
        SELECT unc.collection_name, COUNT(*) as count 
        FROM user_note_collections unc 
        JOIN user_sermon_notes sn ON unc.note_id = sn.id 
        WHERE sn.user_id = ? GROUP BY unc.collection_name
      `, [userId]);
      
      let verses = [];
      if (req.params.sectionType === 'faith_verses') {
        [verses] = (await pool.query(`
          SELECT uvc.collection_name, COUNT(*) as count 
          FROM user_faith_verse_collections uvc
          JOIN user_faith_verses usv ON uvc.verse_id = usv.id
          WHERE usv.user_id = ? GROUP BY uvc.collection_name
        `, [userId])) as [any[], any];
      } else {
        [verses] = (await pool.query(`
          SELECT collection_name, COUNT(*) as count 
          FROM user_verse_collections 
          WHERE user_id = ? GROUP BY collection_name
        `, [userId])) as [any[], any];
      }
      
      const [prompts] = await pool.query(`
        SELECT upc.collection_name, COUNT(*) as count 
        FROM user_prompt_collections upc 
        JOIN user_saved_prompts usp ON upc.prompt_id = usp.id 
        WHERE usp.user_id = ? GROUP BY upc.collection_name
      `, [userId]);
      
      const counts: Record<string, number> = {};
      const addCount = (row: any) => {
        counts[row.collection_name] = (counts[row.collection_name] || 0) + row.count;
      };
      (prayers as any[]).forEach(addCount);
      (notes as any[]).forEach(addCount);
      (verses as any[]).forEach(addCount);
      (prompts as any[]).forEach(addCount);
      
      res.json({ success: true, data: counts });
    } catch (error) { 
      console.error(error); 
      res.status(500).json({ success: false }); 
    }
  });

  app.get('/api/user/:sectionType/collections/:collectionName/:userId', async (req, res) => {
    try {
      const { collectionName, userId } = req.params;
      
      const [prayers] = await pool.query(`
        SELECT upc.prayer_id as id, 'prayer' as type 
        FROM user_prayer_collections upc 
        JOIN user_prayers up ON upc.prayer_id = up.id 
        WHERE upc.collection_name = ? AND up.user_id = ?
      `, [collectionName, userId]);
      
      const [notes] = await pool.query(`
        SELECT unc.note_id as id, 'note' as type 
        FROM user_note_collections unc 
        JOIN user_sermon_notes sn ON unc.note_id = sn.id 
        WHERE unc.collection_name = ? AND sn.user_id = ?
      `, [collectionName, userId]);
      
      let verses = [];
      if (req.params.sectionType === 'faith_verses') {
        [verses] = (await pool.query(`
          SELECT uvc.verse_id as id, 'verse' as type 
          FROM user_faith_verse_collections uvc
          JOIN user_faith_verses usv ON uvc.verse_id = usv.id
          WHERE uvc.collection_name = ? AND usv.user_id = ?
        `, [collectionName, userId])) as [any[], any];
      } else {
        [verses] = (await pool.query(`
          SELECT uvc.verse_id as id, 'verse' as type 
          FROM user_verse_collections uvc
          JOIN user_saved_verses usv ON uvc.verse_id = usv.id
          WHERE uvc.collection_name = ? AND usv.user_id = ?
        `, [collectionName, userId])) as [any[], any];
      }
      
      const [bookmarks] = await pool.query(`
        SELECT uvc.verse_id as id, 'bookmark' as type 
        FROM user_verse_collections uvc
        JOIN user_bookmarks ub ON uvc.verse_id = ub.id
        WHERE uvc.collection_name = ? AND uvc.user_id = ?
      `, [collectionName, userId]);
      
      const [prompts] = await pool.query(`
        SELECT upc.prompt_id as id, 'prompt' as type 
        FROM user_prompt_collections upc
        JOIN user_saved_prompts usp ON upc.prompt_id = usp.id
        WHERE upc.collection_name = ? AND usp.user_id = ?
      `, [collectionName, userId]);
      
      const items = [
        ...(prayers as any[]),
        ...(notes as any[]),
        ...(verses as any[]),
        ...(bookmarks as any[]),
        ...(prompts as any[])
      ];
      
      res.json({ success: true, data: items });
    } catch (error) { 
      console.error(error); 
      res.status(500).json({ success: false }); 
    }
  });



  app.post('/api/user/collections', async (req, res) => {
    try {
      const { userId, title, description } = req.body;
      const [result] = await pool.query('INSERT INTO collections (user_id, title, description) VALUES (?, ?, ?)', [userId, title, description || '']);
      res.json({ success: true, data: { id: (result as any).insertId, user_id: userId, title, description } });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.post('/api/user/collections/:collectionId/items', async (req, res) => {
    try {
      const { items } = req.body; // Array of { id, type }
      const collectionId = req.params.collectionId;
      for (const item of items) {
        await pool.query('INSERT IGNORE INTO collection_items (collection_id, item_id, item_type) VALUES (?, ?, ?)', [collectionId, item.id, item.type]);
      }
      res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  app.get('/api/user/collections/:collectionId/items', async (req, res) => {
    try {
      const collectionId = req.params.collectionId;
      const [rows] = await pool.query('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY added_at DESC', [collectionId]);
      res.json({ success: true, data: rows });
    } catch (error) { res.status(500).json({ success: false }); }
  });

  // -- AI Pastoral Summary (Timeline) --
  app.post('/api/timeline/summary', async (req, res) => {
    try {
      const { events } = req.body;
      if (!events || events.length === 0) {
        return res.status(400).json({ success: false, message: 'Events are required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, message: 'No GEMINI_API_KEY found' });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const eventsText = events.map((e: any) => `Date: ${new Date(e.timestamp).toLocaleDateString()}\nType: ${e.type}\nTitle: ${e.title}\nDescription: ${e.description || ''}`).join('\n\n');

      const prompt = `You are a compassionate, encouraging Christian AI pastor writing a short pastoral summary (about 2-3 paragraphs) to a user based on their recent timeline of spiritual activity.
      
Here is their activity log:
${eventsText}

Write a gentle, encouraging letter to them. Address them as "Dear Friend," and ALWAYS sign off at the very end with "Your AI Pastor". Do not sign off as "Your Pastor" or anything else. It must be clear that you are an AI.
Analyze their spiritual journey based on these activities (prayers, notes, saved verses). Acknowledge their focuses, notice any growth or patterns in faith, and offer biblical comfort.
Do NOT use heavy markdown formatting. You may use **bold** or *italics* sparingly, but do not use large headers or lists. Write it as a heartfelt letter.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
      });

      res.json({ success: true, data: response.text });
    } catch (error) {
      console.error('Pastoral summary error:', error);
      res.status(500).json({ success: false, message: 'Error generating summary' });
    }
  });

  // -- Verse of the Day --
  const getCurrentSeason = (now: Date) => {
    const month = now.getMonth();
    const date = now.getDate();
    if (month === 11 && date <= 25) return 'christmas';
    if (month === 10 && date >= 20 && date <= 30) return 'thanksgiving';
    if (month === 0 && date <= 7) return 'new_year';
    if (month === 2 || month === 3) return 'easter'; // Rough approximation for Spring/Easter
    if (month >= 5 && month <= 7) return 'summer'; // June, July, August
    return 'general';
  };

  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  app.get('/api/verse-of-the-day', async (req, res) => {
    try {
      const now = new Date();
      const season = getCurrentSeason(now);
      const dayOfYear = getDayOfYear(now);

      let [rows] = await pool.query('SELECT * FROM daily_inspiration WHERE season_tag = ?', [season]);
      
      if ((rows as any[]).length === 0 && season !== 'general') {
         [rows] = await pool.query('SELECT * FROM daily_inspiration WHERE season_tag = ?', ['general']);
      }
      
      // Ultimate fallback: if there are no verses for the requested season and no general verses, just grab ANY verses
      if ((rows as any[]).length === 0) {
         [rows] = await pool.query('SELECT * FROM daily_inspiration');
      }

      const verses = rows as any[];
      if (verses.length === 0) {
         return res.status(404).json({ success: false, message: 'No verses found' });
      }

      const index = dayOfYear % verses.length;
      const verse = verses[index];
      res.json({ success: true, data: { ...verse, text: verse.verse_text } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  });

  app.post('/api/verse-deep-dive', async (req, res) => {
    try {
      const { text, reference } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ success: false, message: 'Gemini API key not configured' });

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a compassionate Christian AI pastor. 
The Verse of the Day is ${reference}: "${text}".
Provide a deep, motivating reflection on this verse. Explain how to use it to overcome daily struggles and make today great.
Address the user directly and kindly. Sign off as "Your AI Pastor".
Keep it to 2-3 short, highly inspiring paragraphs. Do not use heavy markdown headers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
      });

      res.json({ success: true, data: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  });

  // 4. Vite Middleware for React frontend (Development)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve built React files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
