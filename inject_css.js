const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

const styleBlock = `
      <style>{` + "`" + `
        @media screen {
          #print-area .text-sm { font-size: 11px !important; line-height: 1.2 !important; }
          #print-area .text-xs { font-size: 10px !important; line-height: 1.2 !important; }
          #print-area .text-lg { font-size: 14px !important; }
          #print-area .text-base { font-size: 12px !important; }
          #print-area .p-2 { padding: 4px !important; }
          #print-area .p-4 { padding: 8px !important; }
          #print-area .p-8 { padding: 16px !important; }
          #print-area .p-12 { padding: 24px !important; }
          #print-area .mb-8 { margin-bottom: 16px !important; }
          #print-area .mb-4 { margin-bottom: 8px !important; }
        }
        @media print {
          /* Reset to normal for printing */
          #print-area .text-sm { font-size: 14px !important; }
          #print-area .text-xs { font-size: 12px !important; }
        }
      ` + "`" + `}</style>
`;

c = c.replace(
  '<div id="print-area"',
  styleBlock + '\n      <div id="print-area"'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Injected media query overrides for laporan on screen');
