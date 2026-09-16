"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Printer, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

type ReportType = "peta_risiko" | "pemantauan_rtp" | "keterjadian" | "efektifitas" | "konteks";

export default function LaporanPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [reportType, setReportType] = useState<ReportType>("peta_risiko");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [risikoData, setRisikoData] = useState<any[]>([]);
  const [konteksData, setKonteksData] = useState<any>(null);
  const [sasaranList, setSasaranList] = useState<any[]>([]);
  const [parentSasaranList, setParentSasaranList] = useState<any[]>([]);
  
  const [unitData, setUnitData] = useState<any>(null);
  const [eselon1Name, setEselon1Name] = useState<string>("");
  
  // Custom states for Footer
  const [tempatTanggal, setTempatTanggal] = useState(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  const [jabatanPimpinan, setJabatanPimpinan] = useState("Kepala Unit Kerja");
  const [namaPimpinan, setNamaPimpinan] = useState("Nama Pimpinan");
  const [nipPimpinan, setNipPimpinan] = useState("NIP. .........................");

  const handleGenerate = async () => {
    if (!user?.unitName || !activeYear) return;
    setIsGenerating(true);
    setShowPreview(false);
    
    try {
      // 1. Ambil data Unit saat ini
      const unitQ = query(collection(db, "units"), where("name", "==", user.unitName));
      const unitSnap = await getDocs(unitQ);
      let eselon1Str = "";
      
      let uDataLevel = "";
      if (!unitSnap.empty) {
        const uData = unitSnap.docs[0].data();
        uDataLevel = uData.level;
        setUnitData(uData);
        
        // Auto-fill form pimpinan
        if (uData.name) {
          setJabatanPimpinan(`Kepala ${uData.name}`);
        }
        if (uData.headName) {
          setNamaPimpinan(uData.headName);
        }
        if (uData.headNip) {
          setNipPimpinan(`NIP. ${uData.headNip}`);
        }
        
        // Coba cari nama eselon 1 jika user adalah eselon 2
        if (uData.level === "eselon_2" && uData.eselon1Id) {
          const e1Q = query(collection(db, "units"), where("__name__", "==", uData.eselon1Id));
          const e1Snap = await getDocs(e1Q);
          if (!e1Snap.empty) {
            eselon1Str = e1Snap.docs[0].data().name;
            setEselon1Name(eselon1Str);
          }
        }
      }
      
      if (reportType === "konteks") {
        const kQ = query(collection(db, "mr_konteks"), where("unitName", "==", user.unitName), where("tahun", "==", activeYear));
        const kSnap = await getDocs(kQ);
        if (!kSnap.empty) {
          setKonteksData({ id: kSnap.docs[0].id, ...kSnap.docs[0].data() });
        } else {
          setKonteksData(null);
        }
        
        if (uDataLevel === "eselon_1") {
          const sQ = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
          const sSnap = await getDocs(sQ);
          setSasaranList(sSnap.docs.map(d => ({id: d.id, ...d.data()})));
          
          const stQ = collection(db, "sasaran_strategis");
          const stSnap = await getDocs(stQ);
          setParentSasaranList(stSnap.docs.map(d => ({id: d.id, ...d.data()})));
        } else if (uDataLevel === "eselon_2") {
          const sQ = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
          const sSnap = await getDocs(sQ);
          setSasaranList(sSnap.docs.map(d => ({id: d.id, ...d.data()})));

          const pQ = collection(db, "sasaran_program");
          const pSnap = await getDocs(pQ);
          setParentSasaranList(pSnap.docs.map(d => ({id: d.id, ...d.data()})));
        }
      } else {
        // 2. Ambil data Risiko
        const riskQ = query(
          collection(db, "mr_identifikasi"), 
          where("unitName", "==", user.unitName),
          where("tahun", "==", activeYear)
        );
        const riskSnap = await getDocs(riskQ);
        const data = riskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort berdasarkan Besaran Risiko Awal (Skala tertinggi ke terendah) - opsional
        data.sort((a: any, b: any) => (b.besaranRisiko || 0) - (a.besaranRisiko || 0));
        
        setRisikoData(data);
      }
      
      setShowPreview(true);
      
      logActivity(user, "Lihat", "Laporan", `Melihat Pratinjau Laporan ${getReportTitle(reportType)}`);
      
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
      toast.error("Terjadi kesalahan saat memuat data laporan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
    logActivity(user, "Cetak", "Laporan", `Mencetak Laporan ${getReportTitle(reportType)}`);
  };

  const escapeCSV = (str: string | undefined | null) => {
    if (!str) return '""';
    const cleanStr = String(str).replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${cleanStr}"`;
  };

  const handleExportExcel = () => {
    let csvContent = '\uFEFF'; // BOM for UTF-8
    let filename = `Laporan_${activeYear}_${reportType}.csv`;

    if (reportType === "peta_risiko") {
      const sasaranTitle = unitData?.level === "eselon_1" ? "Sasaran Program" : "Sasaran Kegiatan";
      csvContent += `No,${sasaranTitle},Indikator Kinerja Utama,Risiko,Sumber Risiko,Kategori Risiko,Penyebab,Dampak,Pengendalian yang ada,Sisa Risiko,Pemilik Risiko,K,D,Skala,Level Risiko\n`;
      risikoData.forEach((item, idx) => {
        csvContent += `${idx + 1},${escapeCSV(item.sasaranTerkait)},${escapeCSV(item.indikatorKinerja)},${escapeCSV(item.pernyataanRisiko)},${escapeCSV(item.sumberPenyebab)},${escapeCSV(item.kategori)},${escapeCSV(item.uraianPenyebab)},${escapeCSV(item.uraianDampak)},${escapeCSV(item.pengendalianAda)},${escapeCSV(item.sisaRisiko)},${escapeCSV(item.pemilikRisiko)},${item.levelKemungkinan || ''},${item.levelDampak || ''},${item.besaranRisiko || ''},${escapeCSV(item.levelRisiko)}\n`;
      });
    } else if (reportType === "pemantauan_rtp") {
      csvContent += "No,Pernyataan Risiko,Rencana Tindak Pengendalian,Progres RTP,Waktu Pelaksanaan RTP,Persentase RTP (%),Link Eviden\n";
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.rtpList && risk.rtpList.length > 0) {
          risk.rtpList.forEach((rtp: any) => {
            csvContent += `${no++},${escapeCSV(risk.pernyataanRisiko)},${escapeCSV(rtp.rencana)},${escapeCSV(rtp.pemantauan?.progres)},${escapeCSV(rtp.pemantauan?.waktuPelaksanaan)},${rtp.pemantauan?.persentase || 0},${escapeCSV(rtp.pemantauan?.linkEviden)}\n`;
          });
        }
      });
    } else if (reportType === "keterjadian") {
      csvContent += "No,Risiko,Uraian Peristiwa,Waktu,Penyebab,Dampak,Rincian Mitigasi,Kondisi Setelah Mitigasi\n";
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.keterjadianList && risk.keterjadianList.length > 0) {
          risk.keterjadianList.forEach((kejadian: any) => {
            csvContent += `${no++},${escapeCSV(risk.pernyataanRisiko)},${escapeCSV(kejadian.kronologi)},${escapeCSV(kejadian.tanggal)},${escapeCSV(kejadian.penyebab)},${escapeCSV(kejadian.dampak)},${escapeCSV(kejadian.rincianMitigasi)},${escapeCSV(kejadian.kondisiSetelahMitigasi)}\n`;
          });
        }
      });
    } else if (reportType === "efektifitas") {
      csvContent += "No,Risiko,RTP,% Progres RTP,K Awal,D Awal,SR Awal,K Target,D Target,SR Target,K Aktual,D Aktual,SR Aktual,Deviasi,Langkah Perbaikan\n";
      let no = 1;
      risikoData.forEach(risk => {
        if (risk.rtpList && risk.rtpList.length > 0) {
          risk.rtpList.forEach((rtp: any) => {
            const e = rtp.efektifitas;
            const progress = rtp.pemantauan?.persentase || 0;
            const deviasi = e?.deviasi !== undefined ? (e.deviasi > 0 ? `+${e.deviasi}` : e.deviasi) : "";
            csvContent += `${no++},${escapeCSV(risk.pernyataanRisiko)},${escapeCSV(rtp.rencana)},${progress},${risk.levelKemungkinan || ''},${risk.levelDampak || ''},${risk.besaranRisiko || ''},${e?.targetKemungkinan || ''},${e?.targetDampak || ''},${e?.targetSkala || ''},${e?.aktualKemungkinan || ''},${e?.aktualDampak || ''},${e?.aktualSkala || ''},${deviasi},${escapeCSV(e?.langkahPerbaikan)}\n`;
          });
        }
      });
    } else if (reportType === "konteks") {
      csvContent += `Sumber Data: ${escapeCSV(konteksData?.sumberData || "-")}\n`;
      csvContent += `Tujuan KL: ${escapeCSV(konteksData?.tujuanKL || "-")}\n`;
      csvContent += `Sumber Temuan: ${escapeCSV(konteksData?.sumberTemuan || "-")}\n`;
      csvContent += `Uraian Temuan: ${escapeCSV(konteksData?.uraianTemuan || "-")}\n`;
      csvContent += `Penyebab Temuan: ${escapeCSV(konteksData?.penyebabTemuan || "-")}\n\n`;
      
      csvContent += `No,Induk Sasaran,Sasaran Kinerja,Indikator,Target,Nama Peraturan,Amanat Peraturan,Pihak Internal,Hubungan Internal,Pihak Eksternal,Hubungan Eksternal\n`;
      
      sasaranList.forEach((sasaran, idx) => {
        const parent = parentSasaranList.find(p => p.id === (unitData?.level === "eselon_1" ? sasaran.strategisId : sasaran.programId));
        const parentName = parent ? parent.name : "-";
        const sasaranName = sasaran.name || "-";
        const peraturan = konteksData?.peraturan?.[sasaran.id] || "-";
        const amanat = konteksData?.amanatPeraturan?.[sasaran.id] || "-";
        const pInt = konteksData?.pihakInternal?.[sasaran.id] || "-";
        const hInt = konteksData?.hubunganInternal?.[sasaran.id] || "-";
        const pEks = konteksData?.pihakEksternal?.[sasaran.id] || "-";
        const hEks = konteksData?.hubunganEksternal?.[sasaran.id] || "-";
        
        if (sasaran.indikators && sasaran.indikators.length > 0) {
          const inds = sasaran.indikators.map((i: any) => i.name).join(" ; ");
          const targs = sasaran.indikators.map((i: any) => i.target).join(" ; ");
          csvContent += `${idx + 1},${escapeCSV(parentName)},${escapeCSV(sasaranName)},${escapeCSV(inds)},${escapeCSV(targs)},${escapeCSV(peraturan)},${escapeCSV(amanat)},${escapeCSV(pInt)},${escapeCSV(hInt)},${escapeCSV(pEks)},${escapeCSV(hEks)}\n`;
        } else {
          csvContent += `${idx + 1},${escapeCSV(parentName)},${escapeCSV(sasaranName)},${escapeCSV(sasaran.ikp || sasaran.ikk || "-")},${escapeCSV(sasaran.target || "-")},${escapeCSV(peraturan)},${escapeCSV(amanat)},${escapeCSV(pInt)},${escapeCSV(hInt)},${escapeCSV(pEks)},${escapeCSV(hEks)}\n`;
        }
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logActivity(user, "Unduh", "Laporan", `Mengunduh Laporan ${getReportTitle(reportType)} (Excel/CSV)`);
  };

  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case "peta_risiko": return "LAPORAN MATRIKS PETA RISIKO";
      case "pemantauan_rtp": return "LAPORAN PEMANTAUAN RENCANA TINDAK PENGENDALIAN";
      case "keterjadian": return "LAPORAN KETERJADIAN RISIKO";
      case "efektifitas": return "LAPORAN EFEKTIFITAS RENCANA TINDAK PENGENDALIAN";
      case "konteks": return "LAPORAN PENETAPAN KONTEKS";
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      
      {/* KOTAK KONTROL - Disembunyikan saat di-print (print:hidden) */}
      <div className="print:hidden space-y-6 no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Cetak Laporan</h2>
            <p className="text-slate-500">
              Pilih jenis laporan Manajemen Risiko yang ingin di-generate.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Jenis Laporan</Label>
              <Select value={reportType} onValueChange={(val: ReportType) => setReportType(val)}>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Pilih Jenis Laporan...">
                    {reportType === "peta_risiko" && "Laporan Matriks Peta Risiko"}
                    {reportType === "pemantauan_rtp" && "Laporan Pemantauan Rencana Tindak Pengendalian"}
                    {reportType === "keterjadian" && "Laporan Keterjadian Risiko"}
                    {reportType === "efektifitas" && "Laporan Efektifitas Rencana Tindak Pengendalian"}
                    {reportType === "konteks" && "Laporan Penetapan Konteks"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="konteks">Laporan Penetapan Konteks</SelectItem>
                  <SelectItem value="peta_risiko">Laporan Matriks Peta Risiko</SelectItem>
                  <SelectItem value="pemantauan_rtp">Laporan Pemantauan Rencana Tindak Pengendalian</SelectItem>
                  <SelectItem value="keterjadian">Laporan Keterjadian Risiko</SelectItem>
                  <SelectItem value="efektifitas">Laporan Efektifitas Rencana Tindak Pengendalian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 lg:col-span-2 flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Previu Laporan
              </Button>
            </div>
          </div>
          
          {showPreview && (
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-slate-500">Sesuaikan Tempat & Tanggal</Label>
                <input 
                  type="text" 
                  value={tempatTanggal} 
                  onChange={(e) => setTempatTanggal(e.target.value)}
                  className="w-full text-sm border-b border-slate-300 focus:outline-none focus:border-indigo-500 pb-1"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-slate-500">Sesuaikan Jabatan Pimpinan</Label>
                <input 
                  type="text" 
                  value={jabatanPimpinan} 
                  onChange={(e) => setJabatanPimpinan(e.target.value)}
                  className="w-full text-sm border-b border-slate-300 focus:outline-none focus:border-indigo-500 pb-1"
                />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs text-slate-500">Sesuaikan Nama Pimpinan</Label>
                <input 
                  type="text" 
                  value={namaPimpinan} 
                  onChange={(e) => setNamaPimpinan(e.target.value)}
                  className="w-full text-sm border-b border-slate-300 focus:outline-none focus:border-indigo-500 pb-1"
                />
              </div>
              <div className="flex-none flex gap-2">
                <Button onClick={handleExportExcel} variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                  <Download className="w-4 h-4 mr-2" />
                  Excel (CSV)
                </Button>
                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak PDF / Print
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AREA PRINT (Previu Laporan) */}
      {showPreview && (
        <div id="print-area" className="bg-white border-2 border-slate-200 print:border-none p-8 md:p-12 min-h-[297mm] shadow-lg print:shadow-none print:p-0" style={{ fontFamily: 'Tahoma, sans-serif' }}>
          
          {/* HEADER LAPORAN */}
          <div className="text-center space-y-1 mb-8">
            <h3 className="text-lg font-bold uppercase">KEMENTERIAN DESA DAN PEMBANGUNAN DAERAH TERTINGGAL</h3>
            
            {/* Hierarki Unit */}
            {unitData?.level === "eselon_1" ? (
              <h4 className="text-base font-bold uppercase">{user?.unitName}</h4>
            ) : unitData?.level === "eselon_2" ? (
              <>
                {eselon1Name && <h4 className="text-base font-bold uppercase">{eselon1Name}</h4>}
                <h4 className="text-base font-bold uppercase">{user?.unitName}</h4>
              </>
            ) : (
              <h4 className="text-base font-bold uppercase">{user?.unitName}</h4>
            )}
            
            <div className="py-4">
              <h2 className="text-xl font-bold uppercase underline decoration-2 underline-offset-4">{getReportTitle(reportType)}</h2>
              <h4 className="text-md font-bold mt-2 uppercase">TAHUN {activeYear}</h4>
            </div>
          </div>

          {/* TABEL CONTENT BERDASARKAN JENIS LAPORAN */}
          <div className="mb-12">
            
            {/* 1. LAPORAN PETA RISIKO */}
            {reportType === "peta_risiko" && (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-center w-12">No</th>
                    <th className="border border-black p-2 text-center">
                      {unitData?.level === "eselon_1" ? "Sasaran Program" : "Sasaran Kegiatan"}
                    </th>
                    <th className="border border-black p-2 text-center">Indikator Kinerja Utama</th>
                    <th className="border border-black p-2 text-center">Risiko</th>
                    <th className="border border-black p-2 text-center">Sumber Risiko</th>
                    <th className="border border-black p-2 text-center">Kategori Risiko</th>
                    <th className="border border-black p-2 text-center">Penyebab</th>
                    <th className="border border-black p-2 text-center">Dampak</th>
                    <th className="border border-black p-2 text-center">Pengendalian yang ada</th>
                    <th className="border border-black p-2 text-center">Sisa Risiko</th>
                    <th className="border border-black p-2 text-center">Pemilik Risiko</th>
                    <th className="border border-black p-1 text-center w-8 text-xs">K</th>
                    <th className="border border-black p-1 text-center w-8 text-xs">D</th>
                    <th className="border border-black p-1 text-center w-10 text-xs">Skala</th>
                    <th className="border border-black p-2 text-center">Level Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {risikoData.length > 0 ? (
                    risikoData.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="border border-black p-2 text-center">{idx + 1}</td>
                        <td className="border border-black p-2 text-xs">{item.sasaranTerkait || "-"}</td>
                        <td className="border border-black p-2 text-xs">{item.indikatorKinerja || "-"}</td>
                        <td className="border border-black p-2 text-xs font-medium">{item.pernyataanRisiko || "-"}</td>
                        <td className="border border-black p-2 text-xs text-center">{item.sumberPenyebab || "-"}</td>
                        <td className="border border-black p-2 text-xs text-center">{item.kategori || "-"}</td>
                        <td className="border border-black p-2 text-xs whitespace-pre-wrap">{item.uraianPenyebab || "-"}</td>
                        <td className="border border-black p-2 text-xs whitespace-pre-wrap">{item.uraianDampak || "-"}</td>
                        <td className="border border-black p-2 text-xs whitespace-pre-wrap">{item.pengendalianAda || "-"}</td>
                        <td className="border border-black p-2 text-xs whitespace-pre-wrap">{item.sisaRisiko || "-"}</td>
                        <td className="border border-black p-2 text-xs text-center">{item.pemilikRisiko || "-"}</td>
                        <td className="border border-black p-1 text-center font-bold text-xs">{item.levelKemungkinan || "-"}</td>
                        <td className="border border-black p-1 text-center font-bold text-xs">{item.levelDampak || "-"}</td>
                        <td className="border border-black p-1 text-center font-bold text-sm bg-slate-50">{item.besaranRisiko || "-"}</td>
                        <td className="border border-black p-2 text-center text-xs font-bold">{item.levelRisiko || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={15} className="border border-black p-4 text-center italic">Tidak ada data risiko</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* 2. LAPORAN PEMANTAUAN RTP */}
            {reportType === "pemantauan_rtp" && (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-center w-12">No</th>
                    <th className="border border-black p-2 text-center w-1/5">Pernyataan Risiko</th>
                    <th className="border border-black p-2 text-center w-1/5">Rencana Tindak Pengendalian</th>
                    <th className="border border-black p-2 text-center">Progres RTP</th>
                    <th className="border border-black p-2 text-center w-32">Waktu Pelaksanaan RTP</th>
                    <th className="border border-black p-2 text-center w-24">Persentase RTP (%)</th>
                    <th className="border border-black p-2 text-center w-32">Link Eviden</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let no = 1;
                    const rows: any[] = [];
                    risikoData.forEach(risk => {
                      if (risk.rtpList && risk.rtpList.length > 0) {
                        risk.rtpList.forEach((rtp: any) => {
                          rows.push(
                            <tr key={`${risk.id}-${rtp.id}`}>
                              <td className="border border-black p-2 text-center">{no++}</td>
                              <td className="border border-black p-2 font-medium">{risk.pernyataanRisiko}</td>
                              <td className="border border-black p-2">{rtp.rencana}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{rtp.pemantauan?.progres || "-"}</td>
                              <td className="border border-black p-2 text-center">{rtp.pemantauan?.waktuPelaksanaan || "-"}</td>
                              <td className="border border-black p-2 text-center font-bold">{rtp.pemantauan?.persentase || 0}%</td>
                              <td className="border border-black p-2 text-center text-xs break-all">
                                {rtp.pemantauan?.linkEviden ? (
                                  <a href={rtp.pemantauan.linkEviden} target="_blank" rel="noreferrer" className="text-blue-600 underline">Link</a>
                                ) : "-"}
                              </td>
                            </tr>
                          );
                        });
                      }
                    });
                    if (rows.length === 0) {
                      return <tr><td colSpan={7} className="border border-black p-4 text-center italic">Tidak ada data RTP untuk dipantau</td></tr>;
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            )}

            {/* 3. LAPORAN KETERJADIAN RISIKO */}
            {reportType === "keterjadian" && (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-center w-12">No</th>
                    <th className="border border-black p-2 text-center w-1/5">Risiko</th>
                    <th className="border border-black p-2 text-center w-1/4">Uraian Peristiwa</th>
                    <th className="border border-black p-2 text-center w-24">Waktu</th>
                    <th className="border border-black p-2 text-center w-1/6">Penyebab</th>
                    <th className="border border-black p-2 text-center w-1/6">Dampak</th>
                    <th className="border border-black p-2 text-center w-1/6">Rincian Mitigasi</th>
                    <th className="border border-black p-2 text-center w-1/6">Kondisi Setelah Mitigasi</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let no = 1;
                    const rows: any[] = [];
                    risikoData.forEach(risk => {
                      if (risk.keterjadianList && risk.keterjadianList.length > 0) {
                        risk.keterjadianList.forEach((kejadian: any) => {
                          rows.push(
                            <tr key={`${risk.id}-${kejadian.id}`}>
                              <td className="border border-black p-2 text-center">{no++}</td>
                              <td className="border border-black p-2 font-medium">{risk.pernyataanRisiko}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{kejadian.kronologi}</td>
                              <td className="border border-black p-2 text-center">{new Date(kejadian.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{kejadian.penyebab}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{kejadian.dampak}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{kejadian.rincianMitigasi || "-"}</td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{kejadian.kondisiSetelahMitigasi || "-"}</td>
                            </tr>
                          );
                        });
                      }
                    });
                    if (rows.length === 0) {
                      return <tr><td colSpan={8} className="border border-black p-4 text-center italic">Tidak ada catatan keterjadian risiko</td></tr>;
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            )}

            {/* 4. LAPORAN EFEKTIFITAS RTP */}
            {reportType === "efektifitas" && (
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-center w-10" rowSpan={2}>No</th>
                    <th className="border border-black p-2 text-center w-1/5" rowSpan={2}>Risiko</th>
                    <th className="border border-black p-2 text-center w-1/5" rowSpan={2}>RTP</th>
                    <th className="border border-black p-2 text-center w-16" rowSpan={2}>% Progres RTP</th>
                    <th className="border border-black p-1 text-center" colSpan={3}>Awal</th>
                    <th className="border border-black p-1 text-center" colSpan={3}>Target</th>
                    <th className="border border-black p-1 text-center" colSpan={3}>Aktual</th>
                    <th className="border border-black p-2 text-center w-16" rowSpan={2}>Deviasi</th>
                    <th className="border border-black p-2 text-center" rowSpan={2}>Langkah Perbaikan</th>
                  </tr>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-1 text-center text-xs">K</th>
                    <th className="border border-black p-1 text-center text-xs">D</th>
                    <th className="border border-black p-1 text-center text-xs">SR</th>
                    <th className="border border-black p-1 text-center text-xs">K</th>
                    <th className="border border-black p-1 text-center text-xs">D</th>
                    <th className="border border-black p-1 text-center text-xs">SR</th>
                    <th className="border border-black p-1 text-center text-xs">K</th>
                    <th className="border border-black p-1 text-center text-xs">D</th>
                    <th className="border border-black p-1 text-center text-xs">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let no = 1;
                    const rows: any[] = [];
                    risikoData.forEach(risk => {
                      if (risk.rtpList && risk.rtpList.length > 0) {
                        risk.rtpList.forEach((rtp: any) => {
                          const e = rtp.efektifitas;
                          const progress = rtp.pemantauan?.persentase || 0;
                          rows.push(
                            <tr key={`${risk.id}-${rtp.id}`}>
                              <td className="border border-black p-2 text-center">{no++}</td>
                              <td className="border border-black p-2 font-medium">{risk.pernyataanRisiko}</td>
                              <td className="border border-black p-2">{rtp.rencana}</td>
                              <td className="border border-black p-2 text-center">{progress}%</td>
                              
                              <td className="border border-black p-1 text-center">{risk.levelKemungkinan || "-"}</td>
                              <td className="border border-black p-1 text-center">{risk.levelDampak || "-"}</td>
                              <td className="border border-black p-1 text-center font-bold bg-slate-50">{risk.besaranRisiko || "-"}</td>
                              
                              <td className="border border-black p-1 text-center">{e?.targetKemungkinan || "-"}</td>
                              <td className="border border-black p-1 text-center">{e?.targetDampak || "-"}</td>
                              <td className="border border-black p-1 text-center font-bold bg-slate-50">{e?.targetSkala || "-"}</td>
                              
                              <td className="border border-black p-1 text-center">{e?.aktualKemungkinan || "-"}</td>
                              <td className="border border-black p-1 text-center">{e?.aktualDampak || "-"}</td>
                              <td className="border border-black p-1 text-center font-bold bg-slate-50">{e?.aktualSkala || "-"}</td>
                              
                              <td className={`border border-black p-2 text-center font-bold ${e ? (e.deviasi <= 0 ? 'text-emerald-700' : 'text-red-700') : ''}`}>
                                {e?.deviasi !== undefined ? (e.deviasi > 0 ? `+${e.deviasi}` : e.deviasi) : "-"}
                              </td>
                              <td className="border border-black p-2 whitespace-pre-wrap">{e?.langkahPerbaikan || "-"}</td>
                            </tr>
                          );
                        });
                      }
                    });
                    if (rows.length === 0) {
                      return <tr><td colSpan={15} className="border border-black p-4 text-center italic">Tidak ada data efektifitas RTP</td></tr>;
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            )}
            {/* 5. LAPORAN PENETAPAN KONTEKS */}
            {reportType === "konteks" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 text-sm mb-4 border-b border-black pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold">Sumber Data / Informasi:</p>
                      <p className="mb-2 whitespace-pre-wrap">{konteksData?.sumberData || "-"}</p>
                    </div>
                    <div>
                      <p className="font-bold">Tujuan Kementerian/Lembaga:</p>
                      <p className="whitespace-pre-wrap">{konteksData?.tujuanKL || "-"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-2">
                    <div>
                      <p className="font-bold">Sumber Temuan:</p>
                      <p className="whitespace-pre-wrap">{konteksData?.sumberTemuan || "-"}</p>
                    </div>
                    <div>
                      <p className="font-bold">Uraian Temuan:</p>
                      <p className="whitespace-pre-wrap">{konteksData?.uraianTemuan || "-"}</p>
                    </div>
                    <div>
                      <p className="font-bold">Penyebab Temuan:</p>
                      <p className="whitespace-pre-wrap">{konteksData?.penyebabTemuan || "-"}</p>
                    </div>
                  </div>
                </div>

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
                    {sasaranList.length > 0 ? (
                      sasaranList.map((sasaran, idx) => {
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
            )}
            
          </div>

          {/* FOOTER TANDA TANGAN */}
          <div className="flex justify-end pt-8 pr-12">
            <div className="text-center w-64">
              <p className="mb-2 text-sm">{tempatTanggal}</p>
              <p className="font-bold text-sm mb-24 whitespace-pre-wrap">{jabatanPimpinan}</p>
              
              <p className="font-bold underline text-sm">{namaPimpinan}</p>
              <p className="text-sm">{nipPimpinan}</p>
            </div>
          </div>
          
        </div>
      )}
      
      {/* GLOBAL PRINT STYLE OVERRIDES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Sembunyikan SEMUA elemen body secara default */
          body * {
            visibility: hidden;
          }
          
          /* Sembunyikan spesifik class UI yang tidak diperlukan di DOM */
          aside, header, .no-print, .print\\:hidden {
            display: none !important;
          }

          /* Tampilkan HANYA kontainer print-area beserta seluruh isi dalamnya */
          #print-area, #print-area * {
            visibility: visible;
          }
          
          /* Tarik print area ke pojok kiri atas menutupi semua padding/margin layout */
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Pastikan tidak ada halaman kosong akibat scroll container Next.js */
          html, body {
            overflow: visible !important;
            height: auto !important;
            min-height: 100vh;
          }
          
          /* Custom table printing rules to avoid page break inside rows */
          tr {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          
          @page {
            size: landscape;
            margin: 1.5cm;
          }
        }
      `}} />
    </div>
  );
}
