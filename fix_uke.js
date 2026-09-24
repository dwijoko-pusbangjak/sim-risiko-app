const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

c = c.replace('<span className="truncate block pr-4">Internal {e1.name}</span>', '<span className="truncate block pr-4">UKE I {e1.name}</span>');

fs.writeFileSync('src/app/dashboard/page.tsx', c);
console.log('Done replacement');
