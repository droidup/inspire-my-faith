import mysql from 'mysql2/promise';
import 'dotenv/config';

const KJV_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

// Helper to determine testament based on book index
// In standard Protestant Bibles, the first 39 books are Old Testament, the next 27 are New Testament.
function getTestament(bookIndex: number): 'OT' | 'NT' {
  return bookIndex < 39 ? 'OT' : 'NT';
}

async function seedDatabase() {
  console.log('🌱 Starting Bible seeding process...');
  
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
    console.log('1. Setting up database schema...');
    
    // Create Books Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        abbrev VARCHAR(10) NOT NULL,
        testament ENUM('OT', 'NT') NOT NULL,
        book_order INT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create Verses Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        chapter INT NOT NULL,
        verse INT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        INDEX idx_book_chapter (book_id, chapter)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Clear existing data to prevent duplicates on re-runs
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('TRUNCATE TABLE verses;');
    await pool.query('TRUNCATE TABLE books;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('2. Fetching KJV Bible JSON from remote repository...');
    const response = await fetch(KJV_JSON_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Bible JSON: ${response.statusText}`);
    }
    
    type BibleBook = { name: string; abbrev: string; chapters: string[][] };
    const bibleData: BibleBook[] = await response.json();

    console.log(`3. Inserting ${bibleData.length} books and their verses...`);
    
    for (let bookIdx = 0; bookIdx < bibleData.length; bookIdx++) {
      const book = bibleData[bookIdx];
      const testament = getTestament(bookIdx);
      const bookOrder = bookIdx + 1;

      // Insert Book
      const [bookResult] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO books (name, abbrev, testament, book_order) VALUES (?, ?, ?, ?)',
        [book.name, book.abbrev, testament, bookOrder]
      );
      const bookId = bookResult.insertId;

      // Prepare verses for bulk insert
      const verseValues: (string | number)[][] = [];
      
      for (let chapterIdx = 0; chapterIdx < book.chapters.length; chapterIdx++) {
        const chapter = book.chapters[chapterIdx];
        const chapterNumber = chapterIdx + 1;

        for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
          const text = chapter[verseIdx];
          const verseNumber = verseIdx + 1;
          verseValues.push([bookId, chapterNumber, verseNumber, text]);
        }
      }

      // Bulk insert verses for this book (batching to avoid payload size limits)
      const batchSize = 1000;
      for (let i = 0; i < verseValues.length; i += batchSize) {
        const batch = verseValues.slice(i, i + batchSize);
        await pool.query(
          'INSERT INTO verses (book_id, chapter, verse, text) VALUES ?',
          [batch]
        );
      }
      
      console.log(`  - Inserted ${book.name} (${verseValues.length} verses)`);
    }

    console.log('✅ Seeding complete! The KJV Bible is now in your MySQL database.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
