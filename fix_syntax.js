const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// The `<style>` is right before `<div id="print-area"`.
// I will move it inside `<div id="print-area">` right after the opening tag.

c = c.replace(
  /<style>\{`[\s\S]*?`\}<\/style>\s*<div id="print-area"/,
  '<div id="print-area"'
);

const styleBlock = `
            <style>{` + "`" + `
              @media screen {
                #print-area .text-sm { font-size: 11px !important; line-height: 1.3 !important; }
                #print-area .text-xs { font-size: 10px !important; line-height: 1.3 !important; }
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
                #print-area .text-sm { font-size: 14px !important; }
                #print-area .text-xs { font-size: 12px !important; }
              }
            ` + "`" + `}</style>
`;

c = c.replace(
  'style={{ fontFamily: \'Tahoma, sans-serif\' }}>\n            \n            {/* HEADER LAPORAN */}',
  'style={{ fontFamily: \'Tahoma, sans-serif\' }}>' + styleBlock + '\n            {/* HEADER LAPORAN */}'
);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
console.log('Fixed syntax error');
