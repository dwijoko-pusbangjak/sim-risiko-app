const fs = require('fs');
let c = fs.readFileSync('src/app/login/page.tsx', 'utf8');

c = c.replace(
  /className="w-full h-11 bg-emerald-600 hover:bg-emerald-700/g,
  'className="w-full h-10 bg-emerald-600 hover:bg-emerald-700'
);

c = c.replace(
  /mt-6/g,
  'mt-4'
); // Reduce margin top of the button slightly

// Check the spacing classes
c = c.replace(
  /space-y-5 xl:space-y-6/g,
  'space-y-4 xl:space-y-5'
);

// Reduce outer padding of the screen to give it more breathing room so the card doesn't touch edges if screen is small
c = c.replace(
  /p-4 relative overflow-hidden/g,
  'p-4 sm:p-8 relative overflow-hidden'
);

fs.writeFileSync('src/app/login/page.tsx', c);
console.log('Fixed button and spacing');
