import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const borderStyle: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
};

const headerFill: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' } // Tailwind slate-50
};

export const exportReportExcel = async (
  reportType: string, 
  activeYear: string, 
  unitData: any, 
  risikoData: any[], 
  konteksData: any,
  parentSasaranList: any[],
  programList: any[],
  kegiatanList: any[],
  sasaranList: any[],
  user: any
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIM-Risiko';
  workbook.created = new Date();
  
  const sheet = workbook.addWorksheet('Laporan');

  let title = "LAPORAN";
  if (reportType === "peta_risiko") title = "LAPORAN MATRIKS PETA RISIKO";
  else if (reportType === "pemantauan_rtp") title = "LAPORAN PEMANTAUAN RENCANA TINDAK PENGENDALIAN";
  else if (reportType === "keterjadian") title = "LAPORAN KETERJADIAN RISIKO";
  else if (reportType === "efektifitas") title = "LAPORAN EFEKTIFITAS RENCANA TINDAK PENGENDALIAN";
  else if (reportType === "konteks") title = "LAPORAN PENETAPAN KONTEKS";

  // Add report title
  sheet.addRow([title]);
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.addRow([`Unit Pemilik Risiko: ${unitData?.name || ""}`]);
  sheet.addRow([`Tahun: ${activeYear}`]);
  sheet.addRow([]);

  let startRow = 5;

  if (reportType === "peta_risiko") {
    const sasaranTitle = unitData?.level === "eselon_1" ? "Sasaran Program" : "Sasaran Kegiatan";
    const headers = ["No", sasaranTitle, "Indikator Kinerja Utama", "Risiko", "Sumber Risiko", "Kategori Risiko", "Penyebab", "Dampak", "Pengendalian yang ada", "Sisa Risiko", "Pemilik Risiko", "K", "D", "Skala", "Level Risiko"];
    
    sheet.columns = [
      { width: 5 }, { width: 25 }, { width: 25 }, { width: 30 }, { width: 15 }, 
      { width: 15 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 20 }, 
      { width: 20 }, { width: 5 }, { width: 5 }, { width: 10 }, { width: 15 }
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true };
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    risikoData.forEach((item, idx) => {
      const row = sheet.addRow([
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
      row.eachCell((cell, colNumber) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: 'top', wrapText: true, horizontal: colNumber <= 1 || colNumber >= 12 ? 'center' : 'left' };
      });
    });

  } else if (reportType === "pemantauan_rtp") {
    const headers = ["No", "Pernyataan Risiko", "Rencana Tindak Pengendalian", "Progres RTP", "Waktu Pelaksanaan RTP", "Persentase RTP (%)", "Link Eviden"];
    sheet.columns = [
      { width: 5 }, { width: 30 }, { width: 30 }, { width: 30 }, 
      { width: 20 }, { width: 15 }, { width: 40 }
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true };
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    let no = 1;
    risikoData.forEach(risk => {
      if (risk.rtpList && risk.rtpList.length > 0) {
        risk.rtpList.forEach((rtp: any) => {
          const row = sheet.addRow([
            no++,
            risk.pernyataanRisiko || "",
            rtp.rencana || "",
            rtp.pemantauan?.progres || "",
            rtp.pemantauan?.waktuPelaksanaan || "",
            (rtp.pemantauan?.persentase || 0) + "%",
            rtp.pemantauan?.linkEviden || ""
          ]);
          row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            cell.alignment = { vertical: 'top', wrapText: true, horizontal: colNumber === 1 || colNumber === 5 || colNumber === 6 ? 'center' : 'left' };
            if (colNumber === 7 && rtp.pemantauan?.linkEviden) {
              cell.value = { text: rtp.pemantauan.linkEviden, hyperlink: rtp.pemantauan.linkEviden };
              cell.font = { color: { argb: 'FF0563C1' }, underline: true };
            }
          });
        });
      }
    });
    
    if (no === 1) {
      const emptyRow = sheet.addRow(["Tidak ada data efektifitas RTP"]);
      sheet.mergeCells(`A${emptyRow.number}:G${emptyRow.number}`);
      emptyRow.getCell(1).alignment = { horizontal: 'center' };
      emptyRow.getCell(1).border = borderStyle;
      emptyRow.getCell(1).font = { italic: true };
    }

  } else if (reportType === "keterjadian") {
    const headers = ["No", "Risiko", "Uraian Peristiwa", "Waktu", "Penyebab", "Dampak", "Rincian Mitigasi", "Kondisi Setelah Mitigasi"];
    sheet.columns = [
      { width: 5 }, { width: 30 }, { width: 30 }, { width: 15 }, 
      { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = { bold: true };
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    let no = 1;
    risikoData.forEach(risk => {
      if (risk.keterjadianList && risk.keterjadianList.length > 0) {
        risk.keterjadianList.forEach((kejadian: any) => {
          const row = sheet.addRow([
            no++,
            risk.pernyataanRisiko || "",
            kejadian.kronologi || "",
            kejadian.tanggal || "",
            kejadian.penyebab || "",
            kejadian.dampak || "",
            kejadian.rincianMitigasi || "",
            kejadian.kondisiSetelahMitigasi || ""
          ]);
          row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            cell.alignment = { vertical: 'top', wrapText: true, horizontal: colNumber === 1 || colNumber === 4 ? 'center' : 'left' };
          });
        });
      }
    });

  } else if (reportType === "efektifitas") {
    sheet.columns = [
      { width: 5 }, { width: 25 }, { width: 25 }, { width: 12 }, 
      { width: 5 }, { width: 5 }, { width: 5 }, 
      { width: 5 }, { width: 5 }, { width: 5 }, 
      { width: 5 }, { width: 5 }, { width: 5 }, 
      { width: 10 }, { width: 25 }
    ];

    // Merged headers for Efektifitas
    const row1 = sheet.addRow(["No", "Risiko", "RTP", "% Progres RTP", "Awal", "", "", "Target", "", "", "Aktual", "", "", "Deviasi", "Langkah Perbaikan"]);
    const row2 = sheet.addRow(["", "", "", "", "K", "D", "SR", "K", "D", "SR", "K", "D", "SR", "", ""]);
    
    // Merge logic
    sheet.mergeCells('A5:A6'); // No
    sheet.mergeCells('B5:B6'); // Risiko
    sheet.mergeCells('C5:C6'); // RTP
    sheet.mergeCells('D5:D6'); // % Progres
    sheet.mergeCells('E5:G5'); // Awal
    sheet.mergeCells('H5:J5'); // Target
    sheet.mergeCells('K5:M5'); // Aktual
    sheet.mergeCells('N5:N6'); // Deviasi
    sheet.mergeCells('O5:O6'); // Langkah Perbaikan

    [row1, row2].forEach(row => {
      row.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = { bold: true };
        cell.border = borderStyle;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      });
    });

    let no = 1;
    risikoData.forEach(risk => {
      if (risk.rtpList && risk.rtpList.length > 0) {
        risk.rtpList.forEach((rtp: any) => {
          const e = rtp.efektifitas;
          const progress = rtp.pemantauan?.persentase || 0;
          const deviasi = e?.deviasi !== undefined ? (e.deviasi > 0 ? `+${e.deviasi}` : e.deviasi) : "";
          
          const row = sheet.addRow([
            no++,
            risk.pernyataanRisiko || "",
            rtp.rencana || "",
            progress + "%",
            risk.levelKemungkinan || "-",
            risk.levelDampak || "-",
            risk.besaranRisiko || "-",
            e?.targetKemungkinan || "-",
            e?.targetDampak || "-",
            e?.targetSkala || "-",
            e?.aktualKemungkinan || "-",
            e?.aktualDampak || "-",
            e?.aktualSkala || "-",
            deviasi || "-",
            e?.langkahPerbaikan || "-"
          ]);

          row.eachCell((cell, colNumber) => {
            cell.border = borderStyle;
            cell.alignment = { vertical: 'top', wrapText: true, horizontal: [2,3,15].includes(colNumber) ? 'left' : 'center' };
            
            // Highlight SR cells
            if ([7, 10, 13].includes(colNumber)) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
              cell.font = { bold: true };
            }
            // Deviasi color
            if (colNumber === 14 && e) {
              cell.font = { bold: true, color: { argb: e.deviasi <= 0 ? 'FF047857' : 'FFB91C1C' } }; // emerald-700 : red-700
            }
          });
        });
      }
    });

  } else if (reportType === "konteks") {
    // Penetapan konteks has multiple small tables
    sheet.columns = [
      { width: 5 }, { width: 30 }, { width: 30 }, { width: 30 }, 
      { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
    ];

    sheet.addRow(["Sumber Data", konteksData?.sumberData || "-"]).font = { bold: true };
    sheet.addRow(["Tujuan KL", konteksData?.tujuanKL || "-"]).font = { bold: true };
    sheet.addRow([]);

    // Table 1: Insiden
    const t1Title = sheet.addRow(["=== Insiden / Temuan Sebelumnya ==="]);
    t1Title.font = { bold: true };
    
    const h1 = sheet.addRow(["No", "Sumber Temuan", "Uraian Temuan", "Penyebab Temuan"]);
    h1.eachCell(cell => { cell.fill = headerFill; cell.font = { bold: true }; cell.border = borderStyle; });
    
    const iList = konteksData?.insidenList || [];
    if (iList.length > 0) {
      iList.forEach((i: any, idx: number) => {
        const row = sheet.addRow([idx + 1, i.sumber || "", i.uraian || "", i.penyebab || ""]);
        row.eachCell(cell => { cell.border = borderStyle; cell.alignment = { wrapText: true, vertical: 'top' }; });
      });
    } else {
      const row = sheet.addRow(["-", "-", "-", "-"]);
      row.eachCell(cell => { cell.border = borderStyle; cell.alignment = { horizontal: 'center' }; });
    }
    sheet.addRow([]);

    // Table 2: Pihak Berkepentingan
    const t2Title = sheet.addRow(["=== Identifikasi Pihak Berkepentingan & Aturan ==="]);
    t2Title.font = { bold: true };

    const h2 = sheet.addRow(["No", "Sasaran Terkait", "Peraturan Terkait", "Amanat Peraturan", "Pihak Internal", "Hubungan Internal", "Pihak Eksternal", "Hubungan Eksternal"]);
    h2.eachCell(cell => { cell.fill = headerFill; cell.font = { bold: true }; cell.border = borderStyle; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });
    
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
          ? sasaran.indikators.map((i: any) => `- ${i.name} (Target: ${i.target})`).join('\
')
          : `- ${sasaran.ikp || sasaran.ikk || '-'} (Target: ${sasaran.target || '-'})`;
          
        const sasaranText = `Induk: ${parentName}\
Sasaran: ${sasaranName}\
Indikator:\
${indText}`;
        
        const row = sheet.addRow([
          idx + 1,
          sasaranText,
          konteksData?.peraturan?.[sasaran.id] || "-",
          konteksData?.amanatPeraturan?.[sasaran.id] || "-",
          konteksData?.pihakInternal?.[sasaran.id] || "-",
          konteksData?.hubunganInternal?.[sasaran.id] || "-",
          konteksData?.pihakEksternal?.[sasaran.id] || "-",
          konteksData?.hubunganEksternal?.[sasaran.id] || "-"
        ]);
        row.eachCell((cell, colNumber) => {
          cell.border = borderStyle;
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: colNumber === 1 ? 'center' : 'left' };
        });
      });
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `Laporan_${activeYear}_${reportType}.xlsx`;
  saveAs(blob, filename);
};
