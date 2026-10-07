const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

if (!c.includes('SearchCheck')) {
  c = c.replace('import { ', 'import { SearchCheck, Send, Inbox, ');
}

// Add Auditor Role block
if (!c.includes('title: "Auditor",')) {
  c = c.replace(
    'const getRoleLabel =',
    `    if (user?.role === "auditor") {
      menuGroups.push({
        title: "Auditor",
        items: [
          { name: "Audit Risiko", href: "/dashboard/audit", icon: SearchCheck },
          { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
        ]
      });
    }
  
    const getRoleLabel =`
  );
}

// Add Proses Audit to eselon_1 and eselon_2
const e1e2ReplaceStr = `{ name: "Proses Audit", href: "/dashboard/proses-audit/kirim", icon: Send },\n          { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox", icon: Inbox },\n          { name: "Cetak Laporan"`;

if (!c.includes('name: "Proses Audit"')) {
  // Replace the first match of Cetak Laporan inside the E1/E2 block
  // Wait, I should carefully find the eselon blocks
  
  c = c.replace(
    /\{ name: "Efektifitas RTP", href: "\/dashboard\/mr-efektifitas" \}\r?\n\s*\],\r?\n\s*icon: ShieldCheck\r?\n\s*\},\r?\n\s*\{ name: "Cetak Laporan"/g,
    `{ name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas" }
          ],
          icon: ShieldCheck
        },
        { 
          name: "Proses Audit", 
          icon: SearchCheck,
          subItems: [
            { name: "Kirim ke Auditor", href: "/dashboard/proses-audit/kirim" },
            { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox" }
          ]
        },
        { name: "Cetak Laporan"`
  );
  
}

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Added audit menus');
