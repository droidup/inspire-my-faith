const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
    waitForConnections: true,
  });

  try {
    // Re-assign prayer collections
    await pool.query(`
      UPDATE user_collection_settings ucs 
      SET section_type = 'prayer' 
      WHERE EXISTS (
        SELECT 1 FROM user_prayer_collections upc 
        JOIN user_prayers up ON upc.prayer_id = up.id 
        WHERE upc.collection_name = ucs.collection_name AND up.user_id = ucs.user_id
      )
    `);
    console.log('Fixed prayer collections');
    
    // Re-assign note collections
    await pool.query(`
      UPDATE user_collection_settings ucs 
      SET section_type = 'note' 
      WHERE EXISTS (
        SELECT 1 FROM user_note_collections unc 
        JOIN user_sermon_notes usn ON unc.note_id = usn.id 
        WHERE unc.collection_name = ucs.collection_name AND usn.user_id = ucs.user_id
      )
    `);
    console.log('Fixed note collections');

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
