const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  try {
    const [rows] = await pool.query(`SELECT p.id, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections FROM user_prayers p LEFT JOIN user_prayer_collections pc ON p.id = pc.prayer_id GROUP BY p.id LIMIT 5`);
    console.log(rows);
  } catch(e) {
    console.error(e.message);
  }
  pool.end();
}
main();
