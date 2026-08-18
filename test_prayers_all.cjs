const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  try {
    const [rows] = await pool.query("SELECT id, title, timestamp FROM user_prayers ORDER BY timestamp DESC LIMIT 20");
    console.log(rows);
  } catch(e) {
    console.error(e.message);
  }
  pool.end();
}
main();
