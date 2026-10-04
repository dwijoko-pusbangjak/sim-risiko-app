const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/laporan/page.tsx', 'utf8');

// Add import if not present
if (!c.includes('import * as XLSX from "xlsx"')) {
    c = c.replace(
        'import { toast } from "sonner";',
        'import { toast } from "sonner";\nimport * as XLSX from "xlsx";'
    );
}

// Extract handleExportExcel block and replace it
// It starts with `const handleExportExcel = () => {`
// And ends at `logActivity(user, "Unduh", "Laporan", \`Mengunduh Laporan \${getReportTitle(reportType)} (Excel/CSV)\`);\n  };`

const oldFunctionRegex = /const handleExportExcel = \(\) => \{[\s\S]*?logActivity\(user, "Unduh", "Laporan", `Mengunduh Laporan \$\{getReportTitle\(reportType\)\} \(Excel\/CSV\)`\);\s*\};/;

const newFunction = `const handleExportExcel = () => {
    let filename = \`Laporan_\${activeYear}_\${reportType}.xlsx\`;
    const wsData: any[][] = [];

    if (reportType === "peta_risiko") {
      const sasaranTitle = unitData?.level === "eselon_1" ? "Sasaran Program" : "Sasaran Kegiatan";
      wsData.push(["No", sasaranTitle, "Indikator Kinerja Utama", "Risiko", "Sumber Risiko", "Kategori Risiko", "Penyebab", "Dampak", "Pengendalian yang ada", "Sisa Risiko", "Pemilik Risiko", "K", "D", "Skala", "Level Risiko"]);
      risikoData.forEach((item, idx) => {
        wsData.push([
          idx + 1,
          item.sasaranTerkait || "",
          item.indikatorKinerja || "",
          item.pernyataanRisiko || "",
          item.sumberPenyebab || "",
          item.kategori || "",
          item.uraianPenyebab || "",
          item.uraianDampak || "",
          item.pengendalianAda || "",
          item.sisaRisiko || "",
          item.pemilikRisiko || "",
          item.levelKemungkinan || "",
          item.levelDampak || "",
          item.besaranRisiko || "",
          item.levelRisiko || ""
        ]);
      });
    } else if (reportType === "pemantauan_rtp") {
      wsData.push(["No", "Pernyataan Risiko", "Rencana Tindak Pengendalian", "Progres RTP", "Waktu Pelaksanaan RTP", "Persentase RTP (%)", "Link Eviden"]);
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.rtpList && risk.rtpList.length > 0) {
          risk.rtpList.forEach((rtp: any) => {
            wsData.push([
              no++,
              risk.pernyataanRisiko || "",
              rtp.rencana || "",
              rtp.pemantauan?.progres || "",
              rtp.pemantauan?.waktuPelaksanaan || "",
              rtp.pemantauan?.persentase || 0,
              rtp.pemantauan?.linkEviden || ""
            ]);
          });
        }
      });
    } else if (reportType === "keterjadian") {
      wsData.push(["No", "Risiko", "Uraian Peristiwa", "Waktu", "Penyebab", "Dampak", "Rincian Mitigasi", "Kondisi Setelah Mitigasi"]);
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.keterjadianList && risk.keterjadianList.length > 0) {
          risk.keterjadianList.forEach((kejadian: any) => {
            wsData.push([
              no++,
              risk.pernyataanRisiko || "",
              kejadian.kronologi || "",
              kejadian.tanggal || "",
              kejadian.penyebab || "",
              kejadian.dampak || "",
              kejadian.rincianMitigasi || "",
              kejadian.kondisiSetelahMitigasi || ""
            ]);
          });
        }
      });
    } else if (reportType === "efektifitas") {
      wsData.push(["No", "Risiko", "RTP", "% Progres RTP", "K Awal", "D Awal", "SR Awal", "K Target", "D Target", "SR Target", "K Aktual", "D Aktual", "SR Aktual", "Deviasi", "Langkah Perbaikan"]);
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.rtpList && risk.rtpList.length > 0) {
          risk.rtpList.forEach((rtp: any) => {
            const e = rtp.efektifitas;
            const progress = rtp.pemantauan?.persentase || 0;
            const deviasi = e?.deviasi !== undefined ? (e.deviasi > 0 ? \`+\${e.deviasi}\` : e.deviasi) : "";
            wsData.push([
              no++,
              risk.pernyataanRisiko || "",
              rtp.rencana || "",
              progress,
              risk.levelKemungkinan || "",
              risk.levelDampak || "",
              risk.besaranRisiko || "",
              e?.targetKemungkinan || "",
              e?.targetDampak || "",
              e?.targetSkala || "",
              e?.aktualKemungkinan || "",
              e?.aktualDampak || "",
              e?.aktualSkala || "",
              deviasi,
              e?.langkahPerbaikan || ""
            ]);
          });
        }
      });
    } else if (reportType === "konteks") {
      wsData.push(["Sumber Data", konteksData?.sumberData || "-"]);
      wsData.push(["Tujuan KL", konteksData?.tujuanKL || "-"]);
      wsData.push([]);
      
      wsData.push(["=== Insiden / Temuan Sebelumnya ==="]);
      wsData.push(["No", "Sumber Temuan", "Uraian Temuan", "Penyebab Temuan"]);
      const iList = konteksData?.insidenList || [];
      if (iList.length > 0) {
        iList.forEach((i: any, idx: number) => {
          wsData.push([idx + 1, i.sumber || "", i.uraian || "", i.penyebab || ""]);
        });
      } else {
        wsData.push(["-", "-", "-", "-"]);
      }
      wsData.push([]);
      
      wsData.push(["=== Identifikasi Pihak Berkepentingan & Aturan ==="]);
      wsData.push(["No", "Sasaran Terkait", "Peraturan Terkait", "Amanat Peraturan", "Pihak Internal", "Hubungan Internal", "Pihak Eksternal", "Hubungan Eksternal"]);
      
      const sList = user?.role === "eselon_1" ? programList : user?.role === "eselon_2" ? kegiatanList : sasaranList;
      if (sList.length > 0) {
        sList.forEach((sasaran, idx) => {
          let parentName = "-";
          if (user?.role === "eselon_1") {
            const sp = parentSasaranList.find(x => x.id === sasaran.strategisId);
            parentName = sp ? sp.name : "-";
          } else if (user?.role === "eselon_2") {
            const p = parentSasaranList.find(x => x.id === sasaran.programId);
            parentName = p ? p.name : "-";
          }
          const sasaranName = sasaran.name || "";
          const indText = sasaran.indikators && sasaran.indikators.length > 0
            ? sasaran.indikators.map((i: any) => \`- \${i.name} (Target: \${i.target})\`).join(' ; ')
            : \`- \${sasaran.ikp || sasaran.ikk || '-'} (Target: \${sasaran.target || '-'})\`;
            
          const sasaranText = \`Induk: \${parentName} | Sasaran: \${sasaranName} | Indikator: \${indText}\`;
          
          wsData.push([
            idx + 1,
            sasaranText,
            konteksData?.peraturan?.[sasaran.id] || "-",
            konteksData?.amanatPeraturan?.[sasaran.id] || "-",
            konteksData?.pihakInternal?.[sasaran.id] || "-",
            konteksData?.hubunganInternal?.[sasaran.id] || "-",
            konteksData?.pihakEksternal?.[sasaran.id] || "-",
            konteksData?.hubunganEksternal?.[sasaran.id] || "-"
          ]);
        });
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, filename);
    
    logActivity(user, "Unduh", "Laporan", \`Mengunduh Laporan \${getReportTitle(reportType)} (Excel)\`);
  };`;

if (oldFunctionRegex.test(c)) {
    c = c.replace(oldFunctionRegex, newFunction);
    
    // Check if there are any remaining escapeCSV calls
    c = c.replace(/const escapeCSV = [\s\S]*?;\n/, ''); // Optional: clean up unused helper if present right before it
    
    // Rename button label from Excel (CSV) to just Excel
    c = c.replace(
      'Excel (CSV)',
      'Excel (.xlsx)'
    );

    fs.writeFileSync('src/app/dashboard/laporan/page.tsx', c);
    console.log('Successfully replaced handleExportExcel');
} else {
    console.log('Failed to find handleExportExcel to replace');
}
