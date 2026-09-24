const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf-8');

c = c.replace('className="flex flex-1 shrink-0 gap-2 whitespace-normal pr-4"', 'className="text-left flex flex-1 shrink-0 gap-2 whitespace-normal pr-4"');

fs.writeFileSync('src/components/ui/select.tsx', c);
