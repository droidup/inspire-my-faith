const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  try {
    const [rows] = await pool.query(`SELECT v.*, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections FROM user_faith_verses v LEFT JOIN user_faith_verse_collections vc ON v.id = vc.verse_id WHERE v.user_id = 'wlAP6w3MHNeAozZWywcPiHvUr1G3' GROUP BY v.id ORDER BY v.isPinned DESC, v.timestamp DESC`);
    console.log('Success', rows.length);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
run();
