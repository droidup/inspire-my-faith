import fs from 'fs';
const path = 'src/components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /                            Build Book\n                          <\/button>}\n                        \)}/g,
  `                            Build Book\n                          </button>\n                        )}`
);

fs.writeFileSync(path, content);
