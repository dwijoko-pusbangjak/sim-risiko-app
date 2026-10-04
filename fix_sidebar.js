const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// 1. Reduce Sidebar Width
c = c.replace(/w-72/g, 'w-64 xl:w-72');

// 2. Reduce horizontal padding in sidebar headers to match the narrower width
c = c.replace(/px-6/g, 'px-4 xl:px-6');

// 3. Make the main menu text a bit smaller so it fits nicely
c = c.replace(/text-\[14px\]/g, 'text-[13px] xl:text-[14px]');

// 4. Shrink the user profile name slightly
c = c.replace(/text-sm font-semibold text-white/g, 'text-xs xl:text-sm font-semibold text-white');
c = c.replace(/text-sm font-semibold text-slate-800/g, 'text-xs xl:text-sm font-semibold text-slate-800');

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Sidebar layout sized down properly');
