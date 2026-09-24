const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/users/page.tsx', 'utf-8');

c = c.replace(/<TableCell>\{u\.unitName\}<\/TableCell>/g,
  `<TableCell><span className="whitespace-normal break-words max-w-[400px] block">{u.unitName}</span></TableCell>`);

fs.writeFileSync('src/app/dashboard/users/page.tsx', c);
