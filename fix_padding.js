const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(
  'className="w-full md:w-[50%] flex items-center justify-center p-8 sm:p-12 bg-white relative"',
  'className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white relative"'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Modified padding');
