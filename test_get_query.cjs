const mysql = require('mysql2/promise');
require('dotenv').config();
async function main() {
  const pool = mysql.createPool({ host: '31.97.208.49', user: 'u902643667_imf_db_admin', password: 'vJZ9koQE:7qy*Ua[P0tY', database: 'u902643667_imf_db07272026' });
  try {
    const [rows] = await pool.query(`SELECT v.id, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections FROM user_saved_verses v LEFT JOIN user_verse_collections vc ON v.id = vc.verse_id AND vc.user_id = v.user_id WHERE v.user_id = ? GROUP BY v.id`, ['fGPJpALt52W5kfMZZREg5MPqBkv2']);
    console.log(rows);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
main();
