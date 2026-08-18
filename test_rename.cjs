const fetch = require('node-fetch'); // Ensure we can make HTTP requests or use built-in fetch if Node 18+

async function test() {
  const userId = 'test_user_id';
  
  // 1. Create settings
  const res1 = await fetch('http://localhost:5000/api/user/collections/settings', { // Assuming port 5000 or replace with actual
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      sectionType: 'verse',
      collectionName: 'Old Name',
      settings: { color: '#000000', icon: 'Folder', description: '', isPinned: false }
    })
  });
  console.log('Settings creation:', await res1.json());

  // 2. Rename
  const res2 = await fetch('http://localhost:5000/api/user/collections/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      sectionType: 'verse',
      oldName: 'Old Name',
      newName: 'New Name'
    })
  });
  console.log('Rename:', await res2.json());
}
test();
