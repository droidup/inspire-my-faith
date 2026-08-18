import fetch from 'node-fetch';

async function testSoulSearch() {
  const res = await fetch('http://localhost:3000/api/soul-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'anxiety', includePrayer: true })
  });
  const data = await res.json();
  console.log("Response:", data);
}

testSoulSearch();
