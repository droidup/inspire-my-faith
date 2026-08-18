const mysql = require('mysql2/promise');
require('dotenv/config');

async function setup() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });
  
  try {
    console.log("Creating collections table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Creating collection_items table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collection_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collection_id INT NOT NULL,
        item_id VARCHAR(255) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        UNIQUE KEY unique_item (collection_id, item_id, item_type)
      )
    `);
    
    console.log("Setup complete!");
  } catch (e) {
    console.error(e);
  }
  process.exit();
}

setup();
