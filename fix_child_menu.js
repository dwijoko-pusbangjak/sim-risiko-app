const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  /<span className=\{`transition-transform duration-200 \$\{isChildActive \? "translate-x-1 font-semibold" : ""\}`\}>\s*\{child.name\}\s*<\/span>/g,
  '<span className={`flex-1 text-left break-words leading-tight transition-transform duration-200 ${isChildActive ? "translate-x-1 font-semibold" : ""}`}>\n                                {child.name}\n                              </span>'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Fixed child item text wrapping');
