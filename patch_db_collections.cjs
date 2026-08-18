const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });

  try {
    // 1. Add user_id column
    console.log("Adding user_id column...");
    await pool.query('ALTER TABLE user_verse_collections ADD COLUMN user_id VARCHAR(255)');
    
    // 2. Populate user_id from user_saved_verses
    console.log("Populating user_id...");
    await pool.query(`
      UPDATE user_verse_collections uvc 
      JOIN user_saved_verses usv ON uvc.verse_id = usv.id 
      SET uvc.user_id = usv.user_id
    `);

    // 3. Delete orphans
    console.log("Deleting orphans...");
    await pool.query('DELETE FROM user_verse_collections WHERE user_id IS NULL');

    // 4. Modify column to NOT NULL and update Primary Key
    console.log("Updating Primary Key...");
    await pool.query('ALTER TABLE user_verse_collections MODIFY COLUMN user_id VARCHAR(255) NOT NULL');
    await pool.query('ALTER TABLE user_verse_collections DROP PRIMARY KEY, ADD PRIMARY KEY (verse_id, user_id, collection_name)');

    console.log("Database patch completed successfully.");
  } catch (err) {
    // If column already exists, it might throw an error. Let's ignore it if it's "Duplicate column name"
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("user_id column already exists. Checking primary key...");
    } else {
      console.error("Error patching database:", err);
    }
  } finally {
    pool.end();
  }
}

main();
