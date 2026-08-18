const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  
  try {
    console.log("Checking if reflection column exists...");
    const [cols] = await pool.query("SHOW COLUMNS FROM user_prayers LIKE 'reflection'");
    if (cols.length === 0) {
      console.log("Adding reflection column...");
      await pool.query("ALTER TABLE user_prayers ADD COLUMN reflection TEXT");
      console.log("Column added successfully!");
    } else {
      console.log("Column already exists.");
    }
  } catch (e) {
    console.error("Error modifying database:", e);
  }
  
  pool.end();
}
main();
