const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/backup/page.tsx', 'utf8');
c = c.replace(/\\\`simrisiko_backup_\\\$\{dateStr\}\.json\\\`/g, '`simrisiko_backup_${dateStr}.json`');
c = c.replace(/\\\`Melakukan pemulihan \\\(restore\\\) \\\$\{totalImported\} dokumen\\\`/g, '`Melakukan pemulihan (restore) ${totalImported} dokumen`');
c = c.replace(/\\\`Berhasil memulihkan \\\$\{totalImported\} data!\\\`/g, '`Berhasil memulihkan ${totalImported} data!`');

// Let's just remove all \`
c = c.replace(/\\`/g, '`');
// and \$
c = c.replace(/\\\$/g, '$');

fs.writeFileSync('src/app/dashboard/backup/page.tsx', c);
