const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/}\n\s*}\n\s*for \(let i = 0/, "}\n              for (let i = 0");
code = code.replace(/}\n\s*}\n\s*for \(let j = 0/, "}\n              for (let j = 0");
fs.writeFileSync('server.ts', code);
