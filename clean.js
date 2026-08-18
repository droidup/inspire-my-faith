import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: '31.97.208.49',
    user: 'u902643667_imf_db_admin',
    password: 'vJZ9koQE:7qy*Ua[P0tY',
    database: 'u902643667_imf_db07272026'
  });
  
  await pool.query("UPDATE verse_translations SET text = REPLACE(text, '<span class=\"red-letter\">', '[red]') WHERE text LIKE '%<span%'");
  await pool.query("UPDATE verse_translations SET text = REPLACE(text, '</span>', '[/red]') WHERE text LIKE '%</span%'");
  console.log('Cleaned up HTML tags in DB');
  process.exit();
}
main();
