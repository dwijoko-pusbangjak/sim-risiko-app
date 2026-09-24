const fs = require('fs');

let content = fs.readFileSync('scratch_laporan.tsx', 'utf-8');

const newCsvBlock = `    } else if (reportType === "konteks") {
      csvContent += \`Sumber Data: \${escapeCSV(konteksData?.sumberData || "-")}\\n\`;
      csvContent += \`Tujuan KL: \${escapeCSV(konteksData?.tujuanKL || "-")}\\n\\n\`;

      csvContent += \`=== Insiden / Temuan Sebelumnya ===\\n\`;
      csvContent += \`No,Sumber Temuan,Uraian Temuan,Penyebab Temuan\\n\`;
      const iList = konteksData?.insidenList || [];
      if (iList.length > 0) {
        iList.forEach((row: any, idx: number) => {
          csvContent += \`\${idx + 1},\${escapeCSV(row.sumber)},\${escapeCSV(row.uraian)},\${escapeCSV(row.penyebab)}\\n\`;
        });
      } else if (konteksData?.sumberTemuan || konteksData?.uraianTemuan || konteksData?.penyebabTemuan) {
        csvContent += \`1,\${escapeCSV(konteksData?.sumberTemuan || "-")},\${escapeCSV(konteksData?.uraianTemuan || "-")},\${escapeCSV(konteksData?.penyebabTemuan || "-")}\\n\`;
      }
      csvContent += \`\\n\`;

      csvContent += \`=== Kebijakan dan Daftar Pemangku Kepentingan Terkait ===\\n\`;
      csvContent += \`No,Sasaran Kinerja,Nama Peraturan,Amanat Peraturan,Pihak Internal,Hubungan Internal,Pihak Eksternal,Hubungan Eksternal\\n\`;
      
      const kList = konteksData?.kebijakanList || [];
      if (kList.length > 0) {
        kList.forEach((row: any, idx: number) => {
          csvContent += \`\${idx + 1},\${escapeCSV(row.sasaran)},\${escapeCSV(row.peraturan)},\${escapeCSV(row.amanat)},\${escapeCSV(row.pihakInternal)},\${escapeCSV(row.hubInternal)},\${escapeCSV(row.pihakEksternal)},\${escapeCSV(row.hubEksternal)}\\n\`;
        });
      } else {
        sasaranList.forEach((sasaran: any, idx: number) => {
          const parent = parentSasaranList.find(p => p.id === (unitData?.level === "eselon_1" ? sasaran.strategisId : sasaran.programId));
          const parentName = parent ? parent.name : "-";
          const sasaranName = sasaran.name || "-";
          const indText = sasaran.indikators && sasaran.indikators.length > 0 
            ? sasaran.indikators.map((i: any) => \`- \${i.name} (Target: \${i.target})\`).join(' ; ')
            : \`- \${sasaran.ikp || sasaran.ikk || '-'} (Target: \${sasaran.target || '-'})\`;
          const sasaranText = \`Induk: \${parentName} | Sasaran: \${sasaranName} | Indikator: \${indText}\`;
          const peraturan = konteksData?.peraturan?.[sasaran.id] || "-";
          const amanat = konteksData?.amanatPeraturan?.[sasaran.id] || "-";
          const pInt = konteksData?.pihakInternal?.[sasaran.id] || "-";
          const hInt = konteksData?.hubunganInternal?.[sasaran.id] || "-";
          const pEks = konteksData?.pihakEksternal?.[sasaran.id] || "-";
          const hEks = konteksData?.hubunganEksternal?.[sasaran.id] || "-";
          
          csvContent += \`\${idx + 1},\${escapeCSV(sasaranText)},\${escapeCSV(peraturan)},\${escapeCSV(amanat)},\${escapeCSV(pInt)},\${escapeCSV(hInt)},\${escapeCSV(pEks)},\${escapeCSV(hEks)}\\n\`;
        });
      }
    }`;

// Replace the CSV block safely
const searchStr = '} else if (reportType === "konteks") {';
const endStr = 'const blob = new Blob([csvContent], { type: \'text/csv;charset=utf-8;\' });';
const startIdx = content.indexOf(searchStr);
const endIdx = content.indexOf(endStr);
content = content.substring(0, startIdx) + newCsvBlock + '\\n\\n    ' + content.substring(endIdx);

const newHtmlBlock = `            {/* 5. LAPORAN PENETAPAN KONTEKS */}
            {reportType === "konteks" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4 border-b border-black pb-4">
                  <div>
                    <p className="font-bold">Sumber Data / Informasi:</p>
                    <p className="mb-2 whitespace-pre-wrap">{konteksData?.sumberData || "-"}</p>
                  </div>
                  <div>
                    <p className="font-bold">Tujuan Kementerian/Lembaga:</p>
                    <p className="whitespace-pre-wrap">{konteksData?.tujuanKL || "-"}</p>
                  </div>
                </div>

                <div className="text-center font-bold mb-4">Insiden / Temuan Sebelumnya</div>
                <table className="w-full border-collapse border border-black text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-black p-2 text-center w-10">No</th>
                      <th className="border border-black p-2 text-center w-1/3">Sumber Temuan</th>
                      <th className="border border-black p-2 text-center w-1/3">Uraian Temuan</th>
                      <th className="border border-black p-2 text-center w-1/3">Penyebab Temuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(konteksData?.insidenList && konteksData.insidenList.length > 0) ? (
                      konteksData.insidenList.map((row: any, idx: number) => (
                        <tr key={row.id || idx}>
                          <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.sumber || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.uraian || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.penyebab || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-black p-2 text-center align-top">1</td>
                        <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{konteksData?.sumberTemuan || "-"}</td>
                        <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{konteksData?.uraianTemuan || "-"}</td>
                        <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{konteksData?.penyebabTemuan || "-"}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="text-center font-bold mb-4">Kebijakan dan Daftar Pemangku Kepentingan Terkait</div>
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-black p-2 text-center w-10" rowSpan={2}>No</th>
                      <th className="border border-black p-2 text-center w-1/5" rowSpan={2}>Sasaran Kinerja</th>
                      <th className="border border-black p-2 text-center w-40" rowSpan={2}>Nama Peraturan</th>
                      <th className="border border-black p-2 text-center w-40" rowSpan={2}>Amanat Peraturan Terkait Unit Kerja</th>
                      <th className="border border-black p-2 text-center" colSpan={2}>Stakeholder Internal</th>
                      <th className="border border-black p-2 text-center" colSpan={2}>Stakeholder Eksternal</th>
                    </tr>
                    <tr className="bg-slate-50">
                      <th className="border border-black p-2 text-center w-28">Stakeholder</th>
                      <th className="border border-black p-2 text-center w-28">Hubungan</th>
                      <th className="border border-black p-2 text-center w-28">Stakeholder</th>
                      <th className="border border-black p-2 text-center w-28">Hubungan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(konteksData?.kebijakanList && konteksData.kebijakanList.length > 0) ? (
                      konteksData.kebijakanList.map((row: any, idx: number) => (
                        <tr key={row.id || idx}>
                          <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.sasaran || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.peraturan || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.amanat || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.pihakInternal || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.hubInternal || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.pihakEksternal || "-"}</td>
                          <td className="border border-black p-2 text-xs align-top whitespace-pre-wrap">{row.hubEksternal || "-"}</td>
                        </tr>
                      ))
                    ) : sasaranList.length > 0 ? (
                      sasaranList.map((sasaran: any, idx: number) => {
                        const parent = parentSasaranList.find(p => p.id === (unitData?.level === "eselon_1" ? sasaran.strategisId : sasaran.programId));
                        return (
                          <tr key={sasaran.id}>
                            <td className="border border-black p-2 text-center align-top">{idx + 1}</td>
                            <td className="border border-black p-2 text-xs align-top">
                              <p className="font-semibold text-slate-700">{parent ? parent.name : "-"}</p>
                              <p className="mt-1 font-medium">{sasaran.name || "-"}</p>
                              <div className="mt-2 text-slate-600">
                                {sasaran.indikators && sasaran.indikators.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1 m-0">
                                    {sasaran.indikators.map((ind: any, i: number) => <li key={i}>{ind.name} (Target: {ind.target})</li>)}
                                  </ul>
                                ) : (
                                  <p>{sasaran.ikp || sasaran.ikk || "-"} (Target: {sasaran.target || "-"})</p>
                                )}
                              </div>
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.peraturan?.[sasaran.id] || "-"}
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.amanatPeraturan?.[sasaran.id] || "-"}
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.pihakInternal?.[sasaran.id] || "-"}
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.hubunganInternal?.[sasaran.id] || "-"}
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.pihakEksternal?.[sasaran.id] || "-"}
                            </td>
                            <td className="border border-black p-2 text-xs whitespace-pre-wrap align-top">
                              {konteksData?.hubunganEksternal?.[sasaran.id] || "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={8} className="border border-black p-4 text-center italic">Tidak ada data sasaran</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}`;

const startHtmlIdx = content.indexOf('{/* 5. LAPORAN PENETAPAN KONTEKS */}');
const endHtmlStr = '          {/* FOOTER TANDA TANGAN */}';
const endHtmlIdx = content.indexOf(endHtmlStr);
content = content.substring(0, startHtmlIdx) + newHtmlBlock + '\\n\\n' + content.substring(endHtmlIdx);

fs.writeFileSync('src/app/dashboard/laporan/page.tsx', content, 'utf-8');
