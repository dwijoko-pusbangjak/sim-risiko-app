const fs = require('fs');

let c = fs.readFileSync('src/app/layout.tsx', 'utf8');

c = c.replace(
  'title: "SIM-Risiko Kemendes PDT",',
  'title: "..:: Sistem Informasi Manajemen Risiko - Kemendesa PDT ::..",'
);

fs.writeFileSync('src/app/layout.tsx', c);
console.log('Modified title in layout.tsx');
