import mysql from 'mysql2/promise';
import 'dotenv/config';

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chapter_summaries (
      book_id INT NOT NULL,
      chapter INT NOT NULL,
      summary TEXT NOT NULL,
      PRIMARY KEY (book_id, chapter),
      FOREIGN KEY (book_id) REFERENCES books(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  
  console.log('chapter_summaries table created!');
  process.exit(0);
}
run();
