const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf-8');
c = c.replace(/whitespace-nowrap/g, 'whitespace-normal pr-4');
fs.writeFileSync('src/components/ui/select.tsx', c);
