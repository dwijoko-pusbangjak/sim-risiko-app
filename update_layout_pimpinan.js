const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

c = c.replace(
  'if (role === "eselon_2") return "Unit Kerja Eselon 2";',
  'if (role === "eselon_2") return "Unit Kerja Eselon 2";\n    if (role === "pimpinan") return "Pimpinan Unit Kerja";'
);

// We need to modify Group 3: Manajemen Risiko (Khusus non-admin)
// Right now it says `if (user.role !== "admin") { ... }`
// If `user.role === "pimpinan"`, we only want Cetak Laporan.
// Wait, the block is:
/*
  // Group 3: Manajemen Risiko (Khusus non-admin)
  if (user.role !== "admin") {
    navGroups.push({
      title: "Manajemen Risiko",
      items: [
         // ...
*/
const oldGroup3 = `  // Group 3: Manajemen Risiko (Khusus non-admin)
  if (user.role !== "admin") {
    navGroups.push({
      title: "Manajemen Risiko",
      items: [
        { name: "Penetapan Konteks", href: "/dashboard/mr-konteks", icon: ClipboardList },
        {
          name: "Proses Manajemen Risiko",
          icon: FolderTree,
          children: [
            { name: "Identifikasi Risiko", href: "/dashboard/mr-identifikasi" },
            { name: "Analisis Risiko", href: "/dashboard/mr-analisis" },
            { name: "Rencana Tindak Pengendalian", href: "/dashboard/mr-rtp" },
            { name: "Pemantauan RTP", href: "/dashboard/mr-pemantauan" },
            { name: "Pencatatan Keterjadian", href: "/dashboard/mr-keterjadian" },
            { name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas" },
          ]
        },
        { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
      ]
    });
  }`;

const newGroup3 = `  // Group 3: Manajemen Risiko (Khusus non-admin)
  if (user.role !== "admin") {
    if (user.role === "pimpinan") {
      navGroups.push({
        title: "Pemantauan & Laporan",
        items: [
          { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
        ]
      });
    } else {
      navGroups.push({
        title: "Manajemen Risiko",
        items: [
          { name: "Penetapan Konteks", href: "/dashboard/mr-konteks", icon: ClipboardList },
          {
            name: "Proses Manajemen Risiko",
            icon: FolderTree,
            children: [
              { name: "Identifikasi Risiko", href: "/dashboard/mr-identifikasi" },
              { name: "Analisis Risiko", href: "/dashboard/mr-analisis" },
              { name: "Rencana Tindak Pengendalian", href: "/dashboard/mr-rtp" },
              { name: "Pemantauan RTP", href: "/dashboard/mr-pemantauan" },
              { name: "Pencatatan Keterjadian", href: "/dashboard/mr-keterjadian" },
              { name: "Efektifitas RTP", href: "/dashboard/mr-efektifitas" },
            ]
          },
          { name: "Cetak Laporan", href: "/dashboard/laporan", icon: BarChart4 }
        ]
      });
    }
  }`;

c = c.replace(oldGroup3, newGroup3);

fs.writeFileSync('src/app/dashboard/layout.tsx', c);
console.log('Updated layout for pimpinan');
