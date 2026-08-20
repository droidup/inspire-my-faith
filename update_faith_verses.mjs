import { promises as fs } from 'fs';

async function updateFile() {
  const file = './src/hooks/useFaithVerses.ts';
  let content = await fs.readFile(file, 'utf8');
  
  // Replace GET
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/faith-verses\/\$\{user\.uid\}`\)/g, "fetch(`/api/get_faith_verses.php?userId=${user.uid}`)");
  
  // Replace POST
  content = content.replace(/fetch\('https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/faith-verses',/g, "fetch('/api/save_faith_verse.php',");
  
  // Replace PUT (note)
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/faith-verses\/\$\{id\}\/note`,/g, "fetch(`/api/update_verse_note.php?verseId=${id}`,");
  
  // Replace DELETE
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/faith-verses\/\$\{id\}\?userId=\$\{user\.uid\}`,/g, "fetch(`/api/delete_faith_verse.php?verseId=${id}&userId=${user.uid}`,");
  
  await fs.writeFile(file, content);
  console.log('Updated useFaithVerses.ts');
}

updateFile().catch(console.error);
