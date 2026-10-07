const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', 'utf8');

c = c.replace(/const handleSend = async \(\) => \{/g, 'const handleSend = async () => {\n    const safeYear = activeYear || new Date().getFullYear().toString();');
c = c.replace(/Tahun \$\{activeYear\}/g, 'Tahun ${safeYear}');
c = c.replace(/_\$\{activeYear\}/g, '_${safeYear}');
c = c.replace(/tahun: activeYear/g, 'tahun: safeYear');

fs.writeFileSync('src/app/dashboard/proses-audit/kirim/page.tsx', c);
console.log('Fixed handleSend safeYear');
