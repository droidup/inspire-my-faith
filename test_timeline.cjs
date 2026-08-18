const http = require('http');

http.get('http://localhost:3000/api/user/timeline/U1n9C1J4NkWf9eKx5uT2S7h8mPq1', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => console.log("Error: " + err.message));
