import mysql from 'mysql2/promise';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const emotionsToHarvest = [
  "abandoned", "abused", "addicted", "angry", "anxious", "ashamed", "betrayed", 
  "bitter", "broken", "burdened", "confused", "defeated", "depressed", "desperate", 
  "disappointed", "doubtful", "empty", "envious", "exhausted", "fearful", "frustrated", 
  "grieving", "guilty", "heartbroken", "helpless", "hopeless", "hurt", "inadequate", 
  "insecure", "insulted", "isolated", "jealous", "lonely", "lost", "misunderstood", 
  "nervous", "numb", "overwhelmed", "panicked", "powerless", "rejected", "remorseful", 
  "resentful", "restless", "sad", "scared", "shameful", "stressed", "suicidal", "tempted", 
  "terrified", "tired", "trapped", "unforgiving", "unloved", "unworthy", "weak", "weary", 
  "worried", "worthless", "grief", "divorce", "loss of job", "financial stress", 
  "illness", "chronic pain", "doubt in faith", "persecuted", "bullied"
];

const BATCH_SIZE = 5; // How many to process per run
const DELAY_MS = 2000; // Delay between API calls to avoid rate limits

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runHarvest() {
  console.log('🌾 Starting Batch Harvest Engine...');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing.');
    return;
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const [existingTopics] = await pool.query<mysql.RowDataPacket[]>('SELECT name, keywords FROM topics');
    const existingKeywords = new Set<string>();
    for (const topic of existingTopics) {
      const kws = topic.keywords.split(',').map((k: string) => k.trim().toLowerCase());
      kws.forEach((k: string) => existingKeywords.add(k));
    }

    let processedCount = 0;

    for (const feeling of emotionsToHarvest) {
      if (processedCount >= BATCH_SIZE) {
        console.log(`\n🛑 Reached batch limit of ${BATCH_SIZE}. Stopping for now.`);
        break;
      }

      if (existingKeywords.has(feeling.toLowerCase())) {
        console.log(`⏩ Skipping "${feeling}", already in database.`);
        continue;
      }

      console.log(`\n🔍 Harvesting data for: "${feeling}"`);
      processedCount++;

      try {
        const prompt = `
          The user is expressing the following feeling or situation: "${feeling}"
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
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });

        const aiData = JSON.parse(response.text || '{}');

        if (aiData.topic_name && aiData.verses && aiData.verses.length > 0) {
          const keywordsArray = (aiData.keywords || []).map((k:string) => k.trim().toLowerCase());
          if (!keywordsArray.includes(feeling.toLowerCase())) {
            keywordsArray.push(feeling.toLowerCase());
          }

          const [topicResult] = await pool.query<mysql.ResultSetHeader>(
            'INSERT INTO topics (name, keywords) VALUES (?, ?)',
            [aiData.topic_name, keywordsArray.join(',')]
          );
          const topicId = topicResult.insertId;

          let mappedVerses = 0;
          for (const v of aiData.verses) {
             const [rows] = await pool.query<mysql.RowDataPacket[]>(`
               SELECT v.id FROM verses v 
               JOIN books b ON v.book_id = b.id 
               WHERE b.name = ? AND v.chapter = ? AND v.verse = ?
             `, [v.book, v.chapter, v.verse]);

             if (rows.length > 0) {
               await pool.query(
                 'INSERT IGNORE INTO verse_topics (topic_id, verse_id) VALUES (?, ?)',
                 [topicId, rows[0].id]
               );
               mappedVerses++;
             }
          }
          
          console.log(`✅ Success! Added topic "${aiData.topic_name}" with ${mappedVerses} mapped KJV verses.`);
          // Add to local set so we don't duplicate within same run if words overlap
          keywordsArray.forEach((k: string) => existingKeywords.add(k));
        }
      } catch (err) {
        console.error(`❌ Failed to harvest "${feeling}":`, err);
      }

      await delay(DELAY_MS);
    }
    console.log('\n🎉 Batch Harvest complete!');

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

runHarvest();
