const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/}\n\s*for \(let j = 0; j < missingVerses\.length; j\+\+\) {/, "}\n              }\n              for (let j = 0; j < missingVerses.length; j++) {");
fs.writeFileSync('server.ts', code);
