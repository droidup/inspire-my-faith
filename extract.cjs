const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf8');
const routes = code.match(/app\.(get|post|put|delete)\(['`"]([^'`"]+)['`"]/g);
console.log(routes.join('\n'));
