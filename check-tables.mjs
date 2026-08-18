import mysql from 'mysql2/promise';
import 'dotenv/config';

async function checkTables() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
  });

  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log("Tables in database:");
    console.log(rows);
    process.exit(0);
  } catch (e) {
    console.error("DB Error:", e.message);
    process.exit(1);
  }
}
checkTables();
