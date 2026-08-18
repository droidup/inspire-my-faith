fetch('http://localhost:3000/api/translate-verses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verses: [{ text: "Hello", verse: 1, chapter: 1 }], version: 'IMF' })
    })
    .then(r => r.json())
    .then(res => console.log('Translate success:', res.success, res))
