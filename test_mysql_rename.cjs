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
    await connection.beginTransaction();

    const userId = '123';
    const oldName = 'Test1';
    const newName = 'Test2';
    const sectionType = 'verse';

    // simulate update setting
    await connection.query(
      'INSERT INTO user_collection_settings (user_id, collection_name, section_type, color, icon, description, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE color = VALUES(color)',
      [userId, oldName, sectionType, '#fff', 'icon', '', 0]
    );

    // simulate rename
    const [res] = await connection.query('UPDATE user_collection_settings SET collection_name = ? WHERE collection_name = ? AND user_id = ? AND section_type = ?', [newName, oldName, userId, sectionType]);
    console.log('Update res:', res);
    
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('Error:', err);
  } finally {
    connection.release();
    await pool.end();
  }
}
main();
