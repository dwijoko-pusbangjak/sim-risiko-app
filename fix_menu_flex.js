const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  /<div className="flex items-center">/g,
  '<div className="flex items-center flex-1 min-w-0 pr-2">'
);

c = c.replace(
  /<span className=\{`text-left leading-tight \$\{isActive \? "font-semibold tracking-wide" : ""\}`\}>\{item\.name\}<\/span>/g,
  '<span className={`text-left leading-tight break-words flex-1 ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

// also the link items (without chevron)
c = c.replace(
  /<span className=\{`\$\{isActive \? "font-semibold tracking-wide" : ""\}`\}>\{item\.name\}<\/span>/g,
  '<span className={`text-left leading-tight break-words flex-1 ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Sidebar robustly fixed');
