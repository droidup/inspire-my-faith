const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '31.97.208.49',
  user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
  password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
  database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
});

async function seed() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_inspiration (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reference VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        season_tag VARCHAR(50) NOT NULL,
        make_it_happen TEXT
      )
    `);

    const [rows] = await pool.query('SELECT COUNT(*) as count FROM daily_inspiration');
    if (rows[0].count > 0) {
      console.log('daily_inspiration already seeded. Count:', rows[0].count);
      // Let's clear and re-seed to ensure the new schema/columns exist.
      await pool.query('TRUNCATE TABLE daily_inspiration');
    }

    const verses = [];
    const seasons = ['general', 'christmas', 'easter', 'thanksgiving', 'new_year', 'summer'];
    
    // Generate 365 verses
    for (let i = 1; i <= 365; i++) {
       let season = 'general';
       if (i <= 30) season = 'new_year';
       else if (i > 90 && i <= 120) season = 'easter';
       else if (i > 150 && i <= 240) season = 'summer';
       else if (i > 300 && i <= 330) season = 'thanksgiving';
       else if (i > 330 && i <= 365) season = 'christmas';
       
       verses.push([
         `Psalm ${i}:1`, // Placeholder reference
         `This is an inspiring verse for day ${i}. It brings hope and joy.`,
         season,
         `Take a moment today to reflect on this verse. Write down one way you can apply it to your life, and share it with someone you love.`
       ]);
    }

    await pool.query(
      'INSERT INTO daily_inspiration (reference, text, season_tag, make_it_happen) VALUES ?',
      [verses]
    );

    console.log('Successfully seeded 365 verses into daily_inspiration!');
  } catch (err) {
    console.error('Error seeding verses:', err);
  } finally {
    pool.end();
  }
}

seed();
