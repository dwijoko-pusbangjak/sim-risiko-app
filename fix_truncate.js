const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/sasaran-kegiatan/page.tsx', 'utf8');

c = c.replace(
  /<span className="truncate text-left w-full">/g,
  '<span className="line-clamp-3 break-words text-left flex-1 min-w-0">'
);

fs.writeFileSync('src/app/dashboard/sasaran-kegiatan/page.tsx', c);
console.log('Fixed truncate in sasaran kegiatan');
