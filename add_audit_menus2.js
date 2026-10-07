const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

if (!c.includes('name: "Proses Audit"')) {
  c = c.replace(
    /\{ name: "Efektifitas RTP", href: "\/dashboard\/mr-efektifitas" \},\s*\]\s*\},/g,
    `{ name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas" },
              ]
            },
            {
              name: "Proses Audit",
              icon: SearchCheck,
              children: [
                { name: "Kirim ke Auditor", href: "/dashboard/proses-audit/kirim" },
                { name: "Inbox Hasil Auditor", href: "/dashboard/proses-audit/inbox" }
              ]
            },`
  );
}

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Added audit menus successfully');
