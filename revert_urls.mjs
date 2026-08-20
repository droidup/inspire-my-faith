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
      if (content.includes('/api/')) {
        // Revert back to Render URL for all fetches that start with /api/
        // Only matching fetch('/api or fetch(`/api
        content = content.replace(/fetch\(['"`]\/api\//g, "fetch('https://inspire-my-faith.onrender.com/api/");
        content = content.replace(/fetch\(`\/api\//g, "fetch(`https://inspire-my-faith.onrender.com/api/");
        await fs.writeFile(fullPath, content);
      }
    }
  }
}

replaceInDir('./src').catch(console.error);
