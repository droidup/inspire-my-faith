import { promises as fs } from 'fs';

async function updateFile() {
  const file = './src/components/BibleReader.tsx';
  let content = await fs.readFile(file, 'utf8');
  content = content.replace("fetch('https://inspire-my-faith.onrender.com/api/bible/books')", "fetch('/api/get_books.php')");
  content = content.replace("fetch('https://inspire-my-faith.onrender.com/api/bible/books')", "fetch('/api/get_books.php')");
  await fs.writeFile(file, content);
  console.log('Updated BibleReader.tsx');
  
  const file2 = './src/components/SoulSearch.tsx';
  let content2 = await fs.readFile(file2, 'utf8');
  content2 = content2.replace("fetch('https://inspire-my-faith.onrender.com/api/soul-search', {", "fetch('/api/save_soul_search.php', {");
  await fs.writeFile(file2, content2);
  console.log('Updated SoulSearch.tsx');
}

updateFile().catch(console.error);
