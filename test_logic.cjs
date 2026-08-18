const mysql = require('mysql2/promise');
require('dotenv').config();
async function main() {
  const pool = mysql.createPool({ host: '31.97.208.49', user: 'u902643667_imf_db_admin', password: 'vJZ9koQE:7qy*Ua[P0tY', database: 'u902643667_imf_db07272026' });
  try {
    const verse = {id: 'Genesis-1-1-IMF', collections: ['Hope', 'Help']};
    const userId = 'fGPJpALt52W5kfMZZREg5MPqBkv2';
    
    await pool.query('DELETE FROM user_verse_collections WHERE verse_id = ? AND user_id = ?', [verse.id, userId]);
    
    const values = verse.collections.map(c => [verse.id, userId, c]);
    await pool.query('INSERT INTO user_verse_collections (verse_id, user_id, collection_name) VALUES ?', [values]);
    
    const [rows] = await pool.query(`SELECT v.id, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections FROM user_saved_verses v LEFT JOIN user_verse_collections vc ON v.id = vc.verse_id AND vc.user_id = v.user_id WHERE v.user_id = ? AND v.id = ? GROUP BY v.id`, [userId, verse.id]);
    
    console.log('GET Result:', rows);
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit();
}
main();
