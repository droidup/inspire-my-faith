const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const RENDER_URL = 'https://inspire-my-faith.onrender.com';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace fetch('/api/...
  content = content.replace(/fetch\(['"]\/api\//g, `fetch('${RENDER_URL}/api/`);
  // Replace fetch(`/api/...
  content = content.replace(/fetch\(\`\/api\//g, `fetch(\`${RENDER_URL}/api/`);
  
  // Replace EventSource('/api/...
  content = content.replace(/new EventSource\(['"]\/api\//g, `new EventSource('${RENDER_URL}/api/`);
  content = content.replace(/new EventSource\(\`\/api\//g, `new EventSource(\`${RENDER_URL}/api/`);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Done! Updated ${changedCount} files.`);
