const http = require('http');

const data = JSON.stringify({
  userId: 'fGPJpALt52W5kfMZZREg5MPqBkv2',
  verse: {
    id: 'Genesis-1-1-IMF',
    bookName: 'Genesis',
    chapter: 1,
    verseNum: 1,
    text: 'Test',
    version: 'IMF',
    collections: ['Hope', 'Help']
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/user/verses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
