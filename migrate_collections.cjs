const mysql = require('mysql2/promise');
require('dotenv/config');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });
  
  try {
    console.log("Adding created_at to user_collection_settings...");
    await pool.query('ALTER TABLE user_collection_settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log("Success!");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("created_at already exists.");
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
migrate();
