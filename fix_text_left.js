const fs = require('fs');
let c = fs.readFileSync('src/components/ui/select.tsx', 'utf-8');

c = c.replace(/className=\{cn\(\n\s*"flex w-full items-center justify-between/g, 'className={cn(\n          "text-left flex w-full items-center justify-between');

fs.writeFileSync('src/components/ui/select.tsx', c);
