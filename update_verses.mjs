import { promises as fs } from 'fs';

async function updateFile(file) {
  let content = await fs.readFile(file, 'utf8');
  
  // Replace GET
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses\/\$\{user\.uid\}`\)/g, "fetch(`/api/get_saved_verses.php?userId=${user.uid}`)");
  content = content.replace(/fetch\('https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses\/\$\{userId\}'\)/g, "fetch(`/api/get_saved_verses.php?userId=${userId}`)");
  
  // Replace POST
  content = content.replace(/fetch\('https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses',/g, "fetch('/api/save_saved_verse.php',");
  
  // Replace PUT (note)
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses\/\$\{id\}\/note`,/g, "fetch(`/api/update_saved_verse_note.php?verseId=${id}`,");
  
  // Replace DELETE
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses\/\$\{id\}\?userId=\$\{user\.uid\}`,/g, "fetch(`/api/delete_saved_verse.php?verseId=${id}&userId=${user.uid}`,");
  
  await fs.writeFile(file, content);
  console.log('Updated ' + file);
}

async function updateTimeline() {
  const file = './src/hooks/useFaithTimeline.ts';
  let content = await fs.readFile(file, 'utf8');
  
  content = content.replace(/fetch\(`https:\/\/inspire-my-faith\.onrender\.com\/api\/user\/verses\/\$\{user\.uid\}`\)/g, "fetch(`/api/get_saved_verses.php?userId=${user.uid}`)");
  
  await fs.writeFile(file, content);
  console.log('Updated timeline');
}

updateFile('./src/hooks/useSavedVerses.ts').catch(console.error);
updateTimeline().catch(console.error);
