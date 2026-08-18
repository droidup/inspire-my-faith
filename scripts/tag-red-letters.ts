import { GoogleGenAI, Type } from '@google/genai';
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Add delay utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const bookId = process.argv[2];
  const chapterArg = process.argv[3];
  
  if (!bookId) {
    console.error("Usage: npx tsx scripts/tag-red-letters.ts <bookId> [chapter]");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026'
  });

  try {
    let chaptersToProcess: number[] = [];
    
    if (chapterArg) {
      chaptersToProcess.push(parseInt(chapterArg));
    } else {
      // Find all chapters for this book
      const [rows] = await pool.query(
        'SELECT MAX(chapter) as max_chapter FROM verses WHERE book_id = ?',
        [bookId]
      );
      const maxChapter = (rows as any[])[0].max_chapter;
      if (!maxChapter) {
        console.error(`Book ID ${bookId} not found or has no chapters.`);
        process.exit(1);
      }
      for (let i = 1; i <= maxChapter; i++) {
        chaptersToProcess.push(i);
      }
    }

    console.log(`Processing Book ID ${bookId}, Chapters: ${chaptersToProcess.join(', ')}`);

    for (const chapter of chaptersToProcess) {
      console.log(`\n--- Processing Chapter ${chapter} ---`);
      
      const [verses] = await pool.query(`
        SELECT v.id as verse_id, v.verse as verse_num, vt.text 
        FROM verses v 
        JOIN verse_translations vt ON v.id = vt.verse_id 
        WHERE vt.version = 'IMF' AND v.book_id = ? AND v.chapter = ?
        ORDER BY v.verse ASC
      `, [bookId, chapter]);
      
      const versesData = verses as any[];
      if (versesData.length === 0) {
        console.log(`No verses found for chapter ${chapter}. Skipping.`);
        continue;
      }

      // Prepare payload for Gemini
      const payload = versesData.map(v => ({
        verse_num: v.verse_num,
        text: v.text
      }));

      const prompt = `You are an expert Bible formatter. Below is a JSON array of verses from a chapter of the New Testament.
Your task is to identify any direct quotes spoken by Jesus Christ or God the Father.
Wrap exactly the words they speak in \`[red]\` and \`[/red]\`.
DO NOT change any words, punctuation, or formatting other than adding the bracket tags around the spoken words.
If a verse does not contain words spoken by Jesus or God, leave the text exactly as it is.

For example:
Input: [{"verse_num": 16, "text": "For God so loved the world that he gave his one and only Son."}]
Output: [{"verse_num": 16, "text": "For God so loved the world that he gave his one and only Son."}]
(No change if it's not a direct quote).

Input: [{"verse_num": 6, "text": "Jesus answered, \\"I am the way and the truth and the life.\\""}]
Output: [{"verse_num": 6, "text": "Jesus answered, \\"[red]I am the way and the truth and the life.[/red]\\""}]

CRITICAL INSTRUCTION: Your response MUST be valid JSON, exactly matching the structure of the input array. DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY the raw JSON array.

Here are the verses to process:
${JSON.stringify(payload, null, 2)}`;

      console.log(`Sending ${versesData.length} verses to Gemini...`);
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt
        });

        if (!response.text) {
             console.error("Empty response from Gemini");
             continue;
        }
        
        let responseText = response.text;
        if (responseText.startsWith("```json")) {
            responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
        } else if (responseText.startsWith("```")) {
            responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
        }
        
        const updatedVerses = JSON.parse(responseText);

        for (const updated of updatedVerses) {
          const original = versesData.find(v => v.verse_num === updated.verse_num);
          if (original && original.text !== updated.text) {
             console.log(`[UPDATE] Verse ${updated.verse_num}:`);
             console.log(`  OLD: ${original.text}`);
             console.log(`  NEW: ${updated.text}`);
             
             // Update database
             await pool.query(
               'UPDATE verse_translations SET text = ? WHERE verse_id = ? AND version = ?',
               [updated.text, original.verse_id, 'IMF']
             );
          }
        }
        console.log(`Finished Chapter ${chapter}.`);
      } catch (err) {
        console.error(`Error processing chapter ${chapter}:`, err);
      }
      
      // Wait to avoid rate limits
      await delay(2000);
    }
    
    console.log("\nDone!");

  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    pool.end();
  }
}

main();
