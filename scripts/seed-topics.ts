import mysql from 'mysql2/promise';
import 'dotenv/config';

const topicsData = [
  {
    name: "Anxiety & Stress",
    keywords: ["anxious", "worry", "worried", "panic", "stress", "stressed", "overwhelmed", "nervous"],
    verses: [
      { book: "Philippians", chapter: 4, verse: 6 },
      { book: "1 Peter", chapter: 5, verse: 7 },
      { book: "Matthew", chapter: 6, verse: 34 },
      { book: "Psalms", chapter: 94, verse: 19 },
      { book: "Proverbs", chapter: 12, verse: 25 },
      { book: "Luke", chapter: 12, verse: 25 },
      { book: "Matthew", chapter: 11, verse: 28 }
    ]
  },
  {
    name: "Fear",
    keywords: ["fear", "afraid", "scared", "terrified", "dread", "frightened"],
    verses: [
      { book: "Isaiah", chapter: 41, verse: 10 },
      { book: "2 Timothy", chapter: 1, verse: 7 },
      { book: "Psalms", chapter: 23, verse: 4 },
      { book: "Psalms", chapter: 27, verse: 1 },
      { book: "Joshua", chapter: 1, verse: 9 },
      { book: "1 John", chapter: 4, verse: 18 },
      { book: "Psalms", chapter: 56, verse: 3 },
      { book: "John", chapter: 14, verse: 27 }
    ]
  },
  {
    name: "Sadness & Depression",
    keywords: ["sad", "depressed", "depression", "grief", "crying", "broken", "pain", "hurt", "sorrow", "down", "heartbroken"],
    verses: [
      { book: "Psalms", chapter: 34, verse: 18 },
      { book: "Revelation", chapter: 21, verse: 4 },
      { book: "Psalms", chapter: 147, verse: 3 },
      { book: "Matthew", chapter: 5, verse: 4 },
      { book: "Psalms", chapter: 30, verse: 5 },
      { book: "John", chapter: 16, verse: 33 }
    ]
  },
  {
    name: "Anger & Frustration",
    keywords: ["angry", "mad", "furious", "rage", "frustrated", "annoyed", "bitter", "resentment", "temper"],
    verses: [
      { book: "Ephesians", chapter: 4, verse: 26 },
      { book: "Proverbs", chapter: 15, verse: 1 },
      { book: "James", chapter: 1, verse: 19 },
      { book: "Psalms", chapter: 37, verse: 8 },
      { book: "Proverbs", chapter: 29, verse: 11 },
      { book: "Ecclesiastes", chapter: 7, verse: 9 }
    ]
  },
  {
    name: "Hopelessness",
    keywords: ["hopeless", "lost", "give up", "giving up", "no way out", "despair", "stuck", "pointless", "suicidal"],
    verses: [
      { book: "Jeremiah", chapter: 29, verse: 11 },
      { book: "Romans", chapter: 15, verse: 13 },
      { book: "Isaiah", chapter: 40, verse: 31 },
      { book: "Lamentations", chapter: 3, verse: 22 },
      { book: "Psalms", chapter: 42, verse: 11 },
      { book: "Hebrews", chapter: 10, verse: 23 },
      { book: "Romans", chapter: 8, verse: 28 }
    ]
  },
  {
    name: "Loneliness",
    keywords: ["lonely", "alone", "isolated", "abandoned", "ignored", "nobody", "no one", "rejected"],
    verses: [
      { book: "Deuteronomy", chapter: 31, verse: 8 },
      { book: "Isaiah", chapter: 41, verse: 10 },
      { book: "Psalms", chapter: 27, verse: 10 },
      { book: "Joshua", chapter: 1, verse: 9 },
      { book: "Matthew", chapter: 28, verse: 20 },
      { book: "Hebrews", chapter: 13, verse: 5 }
    ]
  },
  {
    name: "Guilt & Shame",
    keywords: ["guilty", "shame", "mistake", "sin", "worthless", "bad", "regret", "forgive", "sorry", "condemned"],
    verses: [
      { book: "1 John", chapter: 1, verse: 9 },
      { book: "Romans", chapter: 8, verse: 1 },
      { book: "Psalms", chapter: 103, verse: 12 },
      { book: "Isaiah", chapter: 1, verse: 18 },
      { book: "Ephesians", chapter: 1, verse: 7 },
      { book: "Micah", chapter: 7, verse: 19 }
    ]
  },
  {
    name: "Tired & Weary",
    keywords: ["tired", "exhausted", "weary", "burnt out", "fatigue", "sleep", "weak", "drained"],
    verses: [
      { book: "Matthew", chapter: 11, verse: 28 },
      { book: "Galatians", chapter: 6, verse: 9 },
      { book: "Isaiah", chapter: 40, verse: 29 },
      { book: "Psalms", chapter: 73, verse: 26 },
      { book: "Exodus", chapter: 33, verse: 14 },
      { book: "Psalms", chapter: 4, verse: 8 }
    ]
  },
  {
    name: "Gratitude & Joy",
    keywords: ["grateful", "thankful", "happy", "joy", "blessed", "excited", "good", "praise"],
    verses: [
      { book: "1 Thessalonians", chapter: 5, verse: 16 },
      { book: "1 Thessalonians", chapter: 5, verse: 18 },
      { book: "Psalms", chapter: 118, verse: 24 },
      { book: "James", chapter: 1, verse: 17 },
      { book: "Philippians", chapter: 4, verse: 4 },
      { book: "Psalms", chapter: 100, verse: 4 }
    ]
  },
  {
    name: "Needing Direction",
    keywords: ["confused", "direction", "lost", "decisions", "choice", "guide", "guidance", "future", "what to do"],
    verses: [
      { book: "Proverbs", chapter: 3, verse: 5 },
      { book: "Proverbs", chapter: 3, verse: 6 },
      { book: "Psalms", chapter: 119, verse: 105 },
      { book: "James", chapter: 1, verse: 5 },
      { book: "Psalms", chapter: 32, verse: 8 },
      { book: "Jeremiah", chapter: 33, verse: 3 }
    ]
  }
];

async function seedTopics() {
  console.log('🌱 Starting Topic seeding process...');
  
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
    console.log('1. Setting up topics schema...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        keywords TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS verse_topics (
        topic_id INT NOT NULL,
        verse_id INT NOT NULL,
        PRIMARY KEY (topic_id, verse_id),
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (verse_id) REFERENCES verses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Clear existing
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('TRUNCATE TABLE verse_topics;');
    await pool.query('TRUNCATE TABLE topics;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('2. Inserting topics and mapping verses...');
    
    for (const topic of topicsData) {
      const [topicResult] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO topics (name, keywords) VALUES (?, ?)',
        [topic.name, topic.keywords.join(',')]
      );
      const topicId = topicResult.insertId;

      for (const v of topic.verses) {
        // Find the verse ID
        const [rows] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT v.id FROM verses v JOIN books b ON v.book_id = b.id WHERE b.name = ? AND v.chapter = ? AND v.verse = ?`,
          [v.book, v.chapter, v.verse]
        );

        if (rows.length > 0) {
          const verseId = rows[0].id;
          await pool.query(
            'INSERT IGNORE INTO verse_topics (topic_id, verse_id) VALUES (?, ?)',
            [topicId, verseId]
          );
        } else {
          console.warn(`⚠️ Verse not found: ${v.book} ${v.chapter}:${v.verse}`);
        }
      }
      console.log(`  - Inserted topic "${topic.name}" and mapped verses.`);
    }

    console.log('✅ Topic seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding topics:', error);
  } finally {
    await pool.end();
  }
}

seedTopics();
