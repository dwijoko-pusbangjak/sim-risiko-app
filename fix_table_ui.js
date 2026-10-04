const fs = require('fs');
let c = fs.readFileSync('src/components/ui/table.tsx', 'utf8');

c = c.replace(
  'className={cn("[&_tr]:border-b", className)}',
  'className={cn("sticky top-0 z-10 bg-slate-50 shadow-sm [&_tr]:border-b", className)}'
);

// We should also remove the w-full overflow-x-auto from the internal container of Table because we just added it to the external wrappers!
// Wait, `table.tsx` Table component returns:
// <div className="relative w-full overflow-x-auto">
//   <table ...
// If there's a nested overflow-x-auto inside our new overflow-auto wrapper, the sticky header will only stick to the INNER container. But wait, if the outer wrapper has max-h, the inner wrapper will expand to full height of table, so it will NEVER scroll vertically!
// Ah! This is extremely important!
// In `table.tsx`, the `Table` component wraps `<table>` in an `overflow-x-auto` div!
// So the vertical scroll is happening on the OUTER wrapper we just added, but the sticky header is inside the INNER wrapper which isn't scrolling vertically.
// So the sticky header WILL scroll out of view!
// Even worse, nested scrollbars can be annoying.
// Let's modify `table.tsx`'s `Table` component to just return `<table className={cn("w-full...", className)} />` without the wrapper div! 
// We already wrapped all Tables in the app with `overflow-auto max-h-[...]`.

c = c.replace(
  /<div\s+data-slot="table-container"\s+className="relative w-full overflow-x-auto"\s*>\s*<table([\s\S]*?){\.\.\.props}\s*\/>\s*<\/div>/,
  '<table$1{...props} />'
);

fs.writeFileSync('src/components/ui/table.tsx', c);
console.log('Fixed table.tsx sticky header and removed nested scroll container');
