import mysql from 'mysql2/promise';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

// Ensure the API key is set
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Please set GEMINI_API_KEY in your .env file");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// The prompt tone the user asked for:
// "can we make the summery more detailed and set the tone of the interactions"
const SYSTEM_INSTRUCTION = `You are an expert biblical scholar and engaging communicator.
Your task is to summarize chapters of the Bible.
Tone: Modern, easy-to-understand, detailed, yet structured like a 'cliff note'.
Focus on the main events, the emotional/theological tone of the chapter, and what the writer was trying to express.
Do not exceed 3 paragraphs. Be concise but descriptive.`;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
    waitForConnections: true,
  });

  // Get all book and chapter combinations
  console.log("Fetching book and chapter list...");
  const [books] = await pool.query('SELECT id, name FROM books ORDER BY book_order ASC');
  
  for (const book of books as any[]) {
    const [verses] = await pool.query(
      'SELECT chapter, MAX(verse) as maxVerse FROM verses WHERE book_id = ? GROUP BY chapter ORDER BY chapter ASC',
      [book.id]
    );

    for (const v of verses as any[]) {
      const chapter = v.chapter;

      // Check if we already have it in the database
      const [existing] = await pool.query(
        'SELECT 1 FROM chapter_summaries WHERE book_id = ? AND chapter = ?',
        [book.id, chapter]
      );

      if ((existing as any[]).length > 0) {
        // Skip already generated
        continue;
      }

      console.log(`Generating summary for ${book.name} Chapter ${chapter}...`);

      // Fetch the actual text to give Gemini context
      const [chapterVerses] = await pool.query(
        'SELECT verse, text FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse ASC',
        [book.id, chapter]
      );
      
      const chapterText = (chapterVerses as any[]).map(cv => `${cv.verse}: ${cv.text}`).join('\n');
      const prompt = `Please summarize the following chapter from the Bible (${book.name} Chapter ${chapter}).\n\nChapter Text:\n${chapterText}`;

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        
        const summaryText = response.text || "";
        
        // Save to Database
        await pool.query(
          'INSERT INTO chapter_summaries (book_id, chapter, summary) VALUES (?, ?, ?)',
          [book.id, chapter, summaryText]
        );
        
        console.log(`Saved summary for ${book.name} Chapter ${chapter} to Database.`);
        
        // Wait 15 seconds to respect API rate limits (approx 4 RPM)
        await delay(15000);
      } catch (error: any) {
        console.error(`Failed to generate for ${book.name} ${chapter}:`, error?.message || error);
        // Break on serious errors like auth
        if (error?.status === 401 || error?.status === 403 || error?.message?.includes('API key')) {
          console.error("API Key error. Exiting.");
          process.exit(1);
        }
        await delay(15000); // Also backoff on error
      }
    }
  }

  console.log("Finished generating summaries!");
  process.exit(0);
}

run();
