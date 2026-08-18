const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(/translatedTexts = JSON.parse\(rawText\);\n\s*break;/g, "translatedTexts = JSON.parse(rawText);\n                  await new Promise(res => setTimeout(res, 4500));\n                  break;");
fs.writeFileSync('server.ts', code);
