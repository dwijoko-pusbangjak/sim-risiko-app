const fs = require('fs');
let c = fs.readFileSync('src/components/ui/table.tsx', 'utf8');

c = c.replace(
  'className={cn("w-full caption-bottom text-sm", className)}',
  'className={cn("w-full caption-bottom text-xs xl:text-sm", className)}'
);

// We should also reduce the padding of cells for smaller screens so it doesn't look bloated
c = c.replace(
  'className={cn(\n        "h-10 px-2 text-left align-middle font-medium whitespace-normal min-w-[120px] text-foreground [&:has([role=checkbox])]:pr-0",',
  'className={cn(\n        "h-9 px-2 text-left align-middle font-medium whitespace-normal min-w-[120px] text-foreground [&:has([role=checkbox])]:pr-0",'
);

c = c.replace(
  'className={cn(\n        "p-2 align-middle whitespace-normal min-w-[120px] [&:has([role=checkbox])]:pr-0",',
  'className={cn(\n        "p-1.5 xl:p-2 align-middle whitespace-normal min-w-[120px] [&:has([role=checkbox])]:pr-0",'
);

fs.writeFileSync('src/components/ui/table.tsx', c);
console.log('Fixed table.tsx sizes');
