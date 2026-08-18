import fs from 'fs';
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<button \n                            onClick={\(\) => startBookBuild\(book.id\)}/g,
  `{isCompleted ? <span className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Done</span> : <button \n                            onClick={() => startBookBuild(book.id)}`
);

content = content.replace(
  /                            Build Book\n                          <\/button>\n                        \)}/g,
  `                            Build Book\n                          </button>}\n                        )}`
);

fs.writeFileSync(path, content);
