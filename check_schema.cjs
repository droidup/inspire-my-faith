const mysql = require('mysql2/promise');
require('dotenv/config');

async function check() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });
  
  try {
    const [rows] = await pool.query('DESCRIBE user_prayers');
    console.log(rows);
  } catch (e) {
    console.log(e);
  }
  process.exit();
}
check();
