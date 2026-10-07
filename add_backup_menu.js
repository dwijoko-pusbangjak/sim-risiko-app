const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

if (!c.includes('DatabaseBackup')) {
  c = c.replace(
    'Settings,',
    'Settings,\n  DatabaseBackup,'
  );
}

if (!c.includes('/dashboard/backup')) {
  c = c.replace(
    '{ name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings }',
    '{ name: "Pengaturan Sistem", href: "/dashboard/settings", icon: Settings },\n        { name: "Backup & Restore", href: "/dashboard/backup", icon: DatabaseBackup }'
  );
}

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Added backup menu');
