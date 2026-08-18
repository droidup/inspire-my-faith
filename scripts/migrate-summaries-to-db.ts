import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });
  
  const summariesPath = path.join(process.cwd(), 'src', 'data', 'chapterSummaries.json');
  if (fs.existsSync(summariesPath)) {
    const summaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
    for (const key of Object.keys(summaries)) {
      const [bookId, chapter] = key.split('_');
      const summary = summaries[key];
      await pool.query(
        'INSERT IGNORE INTO chapter_summaries (book_id, chapter, summary) VALUES (?, ?, ?)',
        [bookId, chapter, summary]
      );
      console.log(`Migrated ${bookId} Chapter ${chapter}`);
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}
run();
