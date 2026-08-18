const mysql = require('mysql2/promise');
async function main() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  const [rows] = await pool.query("DESCRIBE verse_translations");
  console.log(rows);
  const [versesRows] = await pool.query("DESCRIBE verses");
  console.log(versesRows);
  pool.end();
}
main();
