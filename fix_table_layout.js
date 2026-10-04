const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

c = c.replace(
  `table-layout: fixed !important; /* Force columns to fit within 100% */`,
  `table-layout: auto !important;`
);

// We should also make sure font size is smaller for print for these massive tables.
c = c.replace(
  `            table {
              page-break-inside: auto;`,
  `            table {
              page-break-inside: auto;
              font-size: 10px !important;`
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Fixed table layout to auto');
