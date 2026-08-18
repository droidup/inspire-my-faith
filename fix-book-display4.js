import fs from 'fs';
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /{isCompleted \? <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-\[10px\] font-bold uppercase tracking-wider">Done<\/span> : /g,
  `isCompleted ? <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Done</span> : `
);

fs.writeFileSync(path, content);
