fetch('http://localhost:3000/api/bible/verses/40/1')
  .then(r => r.json())
  .then(d => {
    console.log(d.data.length);
  })
