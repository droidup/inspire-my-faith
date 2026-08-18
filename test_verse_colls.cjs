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
    const [rows] = await pool.query("SHOW CREATE TABLE user_verse_collections");
    console.log(rows[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
