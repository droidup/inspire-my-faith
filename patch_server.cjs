const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf8');
c = c.replace(
  "res.status(500).json({ success: false, message: 'Database error' });",
  "require('fs').appendFileSync('db-errors.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\\n'); res.status(500).json({ success: false, message: 'Database error', error: error.message });"
);
fs.writeFileSync('server.ts', c);
