const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

// Reduce main menu font sizes
c = c.replace(/text-\[13px\] xl:text-\[14px\]/g, 'text-[12px] xl:text-[13px]');
// Reduce child menu font sizes
c = c.replace(/text-\[13px\] font-medium transition-all/g, 'text-[11px] xl:text-[12px] font-medium transition-all');

// Ensure text-left is working, and add flex-1 to the span if it needs to wrap properly
c = c.replace(
  /<span className=\{`text-left leading-snug \$\{isActive \? "font-semibold tracking-wide" : ""\}`\}>\{item.name\}<\/span>/g,
  '<span className={`text-left leading-tight line-clamp-2 ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

// We also need to fix the case where I might have messed up the regex replacement last time
// Just in case, let's reset the span
c = c.replace(
  /<span className=\{`(text-left [^`]*)`\}>\{item\.name\}<\/span>/g,
  '<span className={`text-left leading-tight ${isActive ? "font-semibold tracking-wide" : ""}`}>{item.name}</span>'
);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Sidebar menu sizes reduced and aligned');
