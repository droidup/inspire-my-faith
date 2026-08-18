const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '31.97.208.49',
    user: process.env.MYSQL_USER || 'u902643667_imf_db_admin',
    password: process.env.MYSQL_PASSWORD || 'vJZ9koQE:7qy*Ua[P0tY',
    database: process.env.MYSQL_DATABASE || 'u902643667_imf_db07272026',
    waitForConnections: true,
  });

  const connection = await pool.getConnection();
  try {
    const oldName = 'Test1';
    const newName = 'Test2';
    const userId = '123';

    // Test prayer rename syntax
    const [resPrayer] = await connection.query('UPDATE user_prayer_collections upc JOIN user_prayers up ON upc.prayer_id = up.id SET upc.collection_name = ? WHERE upc.collection_name = ? AND up.user_id = ?', [newName, oldName, userId]);
    console.log('Prayer syntax valid:', resPrayer);
    
    // Test note rename syntax
    const [resNote] = await connection.query('UPDATE user_note_collections unc JOIN user_sermon_notes usn ON unc.note_id = usn.id SET unc.collection_name = ? WHERE unc.collection_name = ? AND usn.user_id = ?', [newName, oldName, userId]);
    console.log('Note syntax valid:', resNote);

  } catch (err) {
    console.error('Syntax error:', err);
  } finally {
    connection.release();
    await pool.end();
  }
}
main();
