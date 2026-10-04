const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  '<span className={`${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>',
  '<span className={`text-left leading-snug ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

c = c.replace(
  '<span className={`${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>',
  '<span className={`text-left leading-snug ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Fixed text alignment in sidebar menus');
