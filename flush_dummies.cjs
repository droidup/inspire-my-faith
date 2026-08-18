const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  
  const [delRes] = await pool.query("DELETE FROM daily_inspiration WHERE verse_text LIKE 'This is an inspiring verse for day%'");
  console.log('Deleted dummy verses:', delRes.affectedRows);
  
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM daily_inspiration');
  console.log('Total verses remaining:', rows[0].count);
  
  process.exit(0);
}
run();
