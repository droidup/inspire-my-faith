import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const startIdx = content.indexOf('let batchStatus = {');
const endIdx = content.indexOf('  app.get(\'/api/admin/stats\'');

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = content.substring(0, startIdx) + `interface ChapterBuild {
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
    const { bookId } = req.body;
    if (activeBuild.active) {
      return res.status(400).json({ success: false, message: 'A book build is already in progress.' });
    }
    
    try {
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
        
        const apiKey = process.env.GEMINI_API_KEY;
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

          const prompt = \`You are translating Bible verses into a modern, novel-like narrative style, as part of the 'Inspire My Faith' (IMF) version. Make it engaging, relatable, and use United States English.
Here is the chapter summary to guide the context:
\${summary}

Translate the following Berean Standard Bible (BSB) verses:
\${missingVerses.map((v) => \`\${v.book_name} \${v.chapter}:\${v.verse} (\${bsbMap.get(v.id) || v.text})\`).join('\\n')}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.\`;
          
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
              const arrayMatch = rawText.match(/\\[[\\s\\S]*\\]/);
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
                const match = err.message.match(/Please retry in ([\\d.]+)s/);
                if (match && match[1]) {
                  waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 2000;
                }
              }
              
              // Wait in chunks of 1 second
              for(let w = Math.ceil(waitTime / 1000); w > 0; w--) {
                 if (!activeBuild.active) break;
                 updateChapStatus('building', \`Rate limited, retrying in \${w}s...\`);
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
               updateChapStatus('completed', \`Next chapter in \${w}s...\`);
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

` + content.substring(endIdx);

  fs.writeFileSync('server.ts', newContent);
  console.log('Replaced batch build with book build logic.');
} else {
  console.log('Could not find start/end indices.');
}
