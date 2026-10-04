const fs = require('fs');
let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// 1. Remove the XLSX import and add the new one
c = c.replace(/import \* as XLSX from "xlsx";\r?\n/, '');
if (!c.includes('import { exportReportExcel }')) {
    c = c.replace(
        'import { logActivity }',
        'import { exportReportExcel } from "@/lib/exportExcel";\nimport { logActivity }'
    );
}

// 2. Replace handleExportExcel block
const oldFunctionRegex = /const handleExportExcel = \(\) => \{[\s\S]*?logActivity\(user, "Unduh", "Laporan", `Mengunduh Laporan \$\{getReportTitle\(reportType\)\} \(Excel\)`\);\r?\n\s*\};/;

const newFunction = `const handleExportExcel = async () => {
    try {
      await exportReportExcel(
        reportType,
        activeYear,
        unitData,
        risikoData,
        konteksData,
        parentSasaranList,
        programList,
        kegiatanList,
        sasaranList,
        user
      );
      logActivity(user, "Unduh", "Laporan", \`Mengunduh Laporan \${getReportTitle(reportType)} (Excel)\`);
      toast.success("Laporan berhasil diunduh dalam format Excel");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Gagal mengunduh file Excel");
    }
  };`;

if (oldFunctionRegex.test(c)) {
    c = c.replace(oldFunctionRegex, newFunction);
    fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
    console.log('Successfully replaced handleExportExcel with exceljs version');
} else {
    console.log('Failed to find handleExportExcel');
}
