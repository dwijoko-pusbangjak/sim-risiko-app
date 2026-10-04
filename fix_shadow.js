const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(
  'shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 z-10 min-h-[600px]',
  'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col md:flex-row z-10 min-h-[600px] border border-white/20'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified shadow on login box');
