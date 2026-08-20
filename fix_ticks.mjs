import { promises as fs } from 'fs';
import path from 'path';

async function replaceInDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceInDir(fullPath);
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      let content = await fs.readFile(fullPath, 'utf8');
      let modified = false;
      
      // Fix broken template literals from the bad revert script
      if (content.includes("fetch('https://inspire-my-faith.onrender.com/api")) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
           if (lines[i].includes("fetch('https://inspire-my-faith.onrender.com/api") && lines[i].includes("${")) {
               lines[i] = lines[i].replace("fetch('https://", "fetch(`https://");
               modified = true;
           }
        }
        if (modified) {
           content = lines.join('\n');
           await fs.writeFile(fullPath, content);
           console.log(`Fixed backticks in ${fullPath}`);
        }
      }
    }
  }
}

replaceInDir('./src').catch(console.error);
