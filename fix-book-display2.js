import fs from 'fs';
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /{isCompleted \? <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Completed<\/span> : <span className="text-xs text-stone-400">—<\/span>}/g,
  `isCompleted ? <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Completed</span> : <span className="text-xs text-stone-400">—</span>`
);

fs.writeFileSync(path, content);
