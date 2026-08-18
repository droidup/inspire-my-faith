const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace GET /api/bible/books
content = content.replace(
  "const [rows] = await pool.query('SELECT * FROM books ORDER BY book_order ASC');",
  `const [rows] = await pool.query(\`
        SELECT 
          b.*,
          COUNT(v.id) as total_verses,
          COUNT(vt.verse_id) as imf_verses
        FROM books b
        LEFT JOIN verses v ON b.id = v.book_id
        LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
        GROUP BY b.id
        ORDER BY b.book_order ASC
      \`);`
);

// We'll manually replace the batch status block
fs.writeFileSync('server.ts', content);
