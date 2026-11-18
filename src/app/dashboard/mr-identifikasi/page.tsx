"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Save, Plus, Pencil, Trash2, X, AlertCircle, Search, Layers, Filter, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";

interface Indikator { name: string; target: string; }
interface SasaranStrategis { id: string; name: string; iku?: string; indikators?: Indikator[]; }
interface SasaranProgram { id: string; name: string; ikp?: string; indikators?: Indikator[]; }
interface SasaranKegiatan { id: string; name: string; ikk?: string; indikators?: Indikator[]; }

interface IdentifikasiRisiko {
  id: string;
  tahun: string;
  unitName: string;
  indikatorKinerja: string;
  sasaranTerkait: string;
  permasalahan: string;
  pernyataanRisiko: string;
  kategori: string;
  pemilikRisiko: string;
  uraianPenyebab: string;
  sumberPenyebab: string;
  sifatPenyebab: string; // Controllable / Uncontrollable
  uraianDampak: string;
  pihakTerdampak: string;
  pengendalianAda: string;
  penilaianPengendalian: string;
  sisaRisiko: string;
  catatanAuditor?: string;
  catatanPerKolom?: any;
}

// Native Firebase doc id will be used instead of manual uuidv4

export default function IdentifikasiRisikoPage() {
  const { user, loading: authLoading, activeYear } = useAuth();
  
  const [risikoList, setRisikoList] = useState<IdentifikasiRisiko[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter & Pengelompokan Berdasarkan Indikator Kinerja
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRisikoList = useMemo(() => {
    if (!searchTerm.trim()) return risikoList;
    const term = searchTerm.toLowerCase();
    return risikoList.filter(item => 
      item.indikatorKinerja?.toLowerCase().includes(term) ||
      item.sasaranTerkait?.toLowerCase().includes(term) ||
      item.pernyataanRisiko?.toLowerCase().includes(term) ||
      item.permasalahan?.toLowerCase().includes(term) ||
      item.kategori?.toLowerCase().includes(term) ||
      item.pemilikRisiko?.toLowerCase().includes(term)
    );
  }, [risikoList, searchTerm]);

  // Kelompokkan risiko berdasarkan Indikator Kinerja (agar indikator yang sama hanya ditulis 1 kali)
  const groupedRisiko = useMemo(() => {
    const map = new Map<string, { indikatorKinerja: string; sasaranTerkait: string; items: IdentifikasiRisiko[] }>();

    filteredRisikoList.forEach((item) => {
      const ind = item.indikatorKinerja?.trim() || "Tanpa Indikator Kinerja";
      if (!map.has(ind)) {
        map.set(ind, {
          indikatorKinerja: ind,
          sasaranTerkait: item.sasaranTerkait?.trim() || "-",
          items: []
        });
      }
      map.get(ind)!.items.push(item);
    });

    return Array.from(map.values());
  }, [filteredRisikoList]);

  const totalRisikoCount = risikoList.length;
  const totalIndikatorCount = useMemo(() => {
    const set = new Set(risikoList.map(r => (r.indikatorKinerja || "").trim()).filter(Boolean));
    return set.size;
  }, [risikoList]);

  // Sinkronisasi Scrollbar Atas & Bawah
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const isSyncingScroll = useRef(false);
  const [tableScrollWidth, setTableScrollWidth] = useState(2500);

  useEffect(() => {
    const updateScrollWidth = () => {
      if (tableRef.current) {
        setTableScrollWidth(tableRef.current.scrollWidth);
      }
    };

    updateScrollWidth();
    const timer = setTimeout(updateScrollWidth, 150);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && tableRef.current) {
      observer = new ResizeObserver(() => {
        updateScrollWidth();
      });
      observer.observe(tableRef.current);
    }

    window.addEventListener("resize", updateScrollWidth);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener("resize", updateScrollWidth);
    };
  }, [groupedRisiko, isFormVisible]);

  const handleTopScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const handleTableScroll = () => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  };

  const nudgeScroll = (amount: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Master Data (Indikator & Sasaran)
  const [kinerjaList, setKinerjaList] = useState<{ id: string; indikator: string; sasaran: string }[]>([]);

  // Form State
  const [formData, setFormData] = useState<IdentifikasiRisiko>({
    id: "",
    tahun: activeYear,
    unitName: "",
    indikatorKinerja: "",
    sasaranTerkait: "",
    permasalahan: "",
    pernyataanRisiko: "",
    kategori: "",
    pemilikRisiko: "",
    uraianPenyebab: "",
    sumberPenyebab: "",
    sifatPenyebab: "",
    uraianDampak: "",
    pihakTerdampak: "",
    pengendalianAda: "",
    penilaianPengendalian: "",
    sisaRisiko: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchMasterData();
      fetchRisikoList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, activeYear]);

  // Handle otomatisasi sisaRisiko
  useEffect(() => {
    if (formData.penilaianPengendalian === "Belum Memadai") {
      setFormData(prev => ({ ...prev, sisaRisiko: prev.pernyataanRisiko }));
    } else if (formData.penilaianPengendalian === "Sudah Memadai") {
      setFormData(prev => ({ ...prev, sisaRisiko: "Tidak ada" }));
    } else if (formData.penilaianPengendalian === "") {
      setFormData(prev => ({ ...prev, sisaRisiko: "" }));
    }
  }, [formData.penilaianPengendalian, formData.pernyataanRisiko]);

  const fetchMasterData = async () => {
    try {
      if (!user?.unitName) return;
      
      let list: { id: string; indikator: string; sasaran: string }[] = [];
      
      if (user.role === "kementerian") {
        const snap = await getDocs(collection(db, "sasaran_strategis"));
        snap.docs.forEach(d => {
          const data = d.data() as SasaranStrategis;
          if (data.indikators && data.indikators.length > 0) {
            data.indikators.forEach((ind, i) => {
              list.push({ id: d.id + "_" + i, indikator: ind.name, sasaran: data.name });
            });
          } else if (data.iku) {
            list.push({ id: d.id, indikator: data.iku, sasaran: data.name });
          }
        });
      } else if (user.role === "eselon_1") {
        const q = query(collection(db, "sasaran_program"), where("unitName", "==", user.unitName));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          const data = d.data() as SasaranProgram;
          if (data.indikators && data.indikators.length > 0) {
            data.indikators.forEach((ind, i) => {
              list.push({ id: d.id + "_" + i, indikator: ind.name, sasaran: data.name });
            });
          } else if (data.ikp) {
            list.push({ id: d.id, indikator: data.ikp, sasaran: data.name });
          }
        });
      } else if (user.role === "eselon_2") {
        const q = query(collection(db, "sasaran_kegiatan"), where("unitName", "==", user.unitName));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          const data = d.data() as SasaranKegiatan;
          if (data.indikators && data.indikators.length > 0) {
            data.indikators.forEach((ind, i) => {
              list.push({ id: d.id + "_" + i, indikator: ind.name, sasaran: data.name });
            });
          } else if (data.ikk) {
            list.push({ id: d.id, indikator: data.ikk, sasaran: data.name });
          }
        });
      }
      setKinerjaList(list);
    } catch (error) {
      console.error("Gagal mengambil master kinerja:", error);
    }
  };

  const fetchRisikoList = async () => {
    setIsListLoading(true);
    try {
      if (!user?.unitName) {
        setIsListLoading(false);
        return;
      }
      const safeYear = activeYear || new Date().getFullYear().toString();
      const q = query(
        collection(db, "mr_identifikasi"), 
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      
      // Auto-heal mismatched IDs
      snap.docs.forEach(docSnap => {
        const d = docSnap.data();
        if (d.id && d.id !== docSnap.id) {
          import('firebase/firestore').then(({ doc, setDoc }) => {
            setDoc(doc(db, "mr_identifikasi", docSnap.id), { id: docSnap.id }, { merge: true });
          });
        }
      });
      
      const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as IdentifikasiRisiko));
      setRisikoList(data);
    } catch (error: any) {
      console.error("Error fetching list:", error);
      toast.error(`Gagal memuat: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsListLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      tahun: activeYear,
      unitName: user?.unitName || "",
      indikatorKinerja: "",
      sasaranTerkait: "",
      permasalahan: "",
      pernyataanRisiko: "",
      kategori: "",
      pemilikRisiko: user?.unitName || "",
      uraianPenyebab: "",
      sumberPenyebab: "",
      sifatPenyebab: "",
      uraianDampak: "",
      pihakTerdampak: "",
      pengendalianAda: "",
      penilaianPengendalian: "",
      sisaRisiko: "",
      catatanAuditor: "",
      catatanPerKolom: undefined,
    });
    setIsEditMode(false);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleEdit = (item: IdentifikasiRisiko) => {
    setFormData(item);
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "mr_identifikasi", id));
      toast.success("Data berhasil dihapus!");
      if (isFormVisible && id === formData.id) {
        setIsFormVisible(false);
      }
      fetchRisikoList();
    } catch (error) {
      console.error("Gagal hapus:", error);
      toast.error("Gagal menghapus data.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.unitName) return toast.error("Unit Kerja tidak ditemukan.");
    
    setIsSaving(true);
    try {
      const docRef = formData.id ? doc(db, "mr_identifikasi", formData.id) : doc(collection(db, "mr_identifikasi"));
      
      const dataToSave: any = { 
        ...formData, 
        id: docRef.id,
        updatedAt: new Date().toISOString(), 
        ownerId: user.uid 
      };
      
      // Hapus undefined values agar Firebase tidak error
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });
      
      await setDoc(docRef, dataToSave, { merge: true });
      
      import('@/lib/logger').then(({ logActivity }) => {
        logActivity(
          user, 
          formData.id ? "Edit" : "Tambah", 
          "Identifikasi Risiko", 
          `Risiko: ${dataToSave.pernyataanRisiko}`
        );
      });

      toast.success("Identifikasi Risiko berhasil disimpan!");
      setIsFormVisible(false);
      fetchRisikoList();
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error(`Gagal menyimpan: ${error?.message || "Kesalahan tidak diketahui"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Saat dropdown Indikator berubah, sesuaikan Sasaran
  const handleIndikatorChange = (val: string) => {
    const selected = kinerjaList.find(k => k.indikator === val);
    setFormData(prev => ({
      ...prev,
      indikatorKinerja: val,
      sasaranTerkait: selected ? selected.sasaran : ""
    }));
  };

  if (authLoading || isListLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Halaman & Statistik Kelompok Indikator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Identifikasi Risiko</h2>
              <p className="text-xs text-slate-500">
                Daftar risiko Tahun Anggaran {activeYear} dikelompokkan berdasarkan Indikator Sasaran Kinerja.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Kelompok Indikator:</span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              {totalIndikatorCount}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Total Risiko:</span>
            <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {totalRisikoCount}
            </span>
          </div>

          {!isFormVisible && (
            <Button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs h-9">
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Identifikasi Risiko
            </Button>
          )}
        </div>
      </div>

      {/* Bar Pencarian & Info Tampilan */}
      {!isFormVisible && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari indikator kinerja, sasaran, atau risiko..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-xs h-9 rounded-xl shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Menampilkan <strong>{filteredRisikoList.length}</strong> dari <strong>{risikoList.length}</strong> risiko ({groupedRisiko.length} kelompok indikator)</span>
          </div>
        </div>
      )}

      {/* Tabel Daftar Risiko Berdasarkan Kelompok Indikator */}
      {!isFormVisible && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in zoom-in-95">
          {/* Bar Informasi Freeze & Tombol Nudge Scroll */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold text-[11px] border border-blue-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-blue-700" /> Freeze Kolom Aktif
              </span>
              <span className="text-slate-600 font-medium hidden sm:inline">
                Kolom <strong className="text-slate-800">Indikator Kinerja</strong> s.d. <strong className="text-slate-800">Pernyataan Risiko</strong> terkunci di sisi kiri saat tabel digeser ke samping.
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-slate-500 mr-1 hidden md:inline">Geser cepat:</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => nudgeScroll(-350)}
                className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-300 gap-1 rounded-lg"
                title="Geser tabel ke kiri"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Ke Kiri
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => nudgeScroll(350)}
                className="h-7 px-2.5 text-xs text-slate-700 hover:text-blue-700 hover:bg-blue-50 border-slate-300 gap-1 rounded-lg"
                title="Geser tabel ke kanan"
              >
                Ke Kanan <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Bilah Scrollbar Atas (Top Scrollbar) yang tersinkronisasi */}
          <div 
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden border-b border-slate-200 bg-slate-100/70 custom-scrollbar"
            style={{ height: '15px' }}
          >
            <div style={{ width: `${Math.max(tableScrollWidth, 2500)}px`, height: '1px' }} />
          </div>

          {/* Kontainer Tabel Utama */}
          <div 
            ref={tableScrollRef}
            onScroll={handleTableScroll}
            className="overflow-auto max-h-[calc(100vh-17rem)] relative custom-scrollbar pb-2"
          >
            <Table ref={tableRef as any} className="border-separate border-spacing-0 w-full">
              <TableHeader className="bg-slate-100/95 sticky top-0 z-30">
                <TableRow className="border-b border-slate-200 text-slate-700">
                  {/* Kolom 1: Indikator Kinerja (Sticky Left 0px) */}
                  <TableHead 
                    style={{ left: 0 }}
                    className="sticky top-0 left-0 z-40 bg-slate-100 font-bold text-slate-800 w-[220px] min-w-[220px] max-w-[220px] border-b border-r border-slate-200"
                  >
                    Indikator Kinerja
                  </TableHead>

                  {/* Kolom 2: Sasaran Terkait (Sticky Left 220px) */}
                  <TableHead 
                    style={{ left: 220 }}
                    className="sticky top-0 z-40 bg-slate-100 font-bold text-slate-800 w-[200px] min-w-[200px] max-w-[200px] border-b border-r border-slate-200"
                  >
                    Sasaran Terkait
                  </TableHead>

                  {/* Kolom 3: Permasalahan (Sticky Left 420px) */}
                  <TableHead 
                    style={{ left: 420 }}
                    className="sticky top-0 z-40 bg-slate-100 font-bold text-slate-800 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200"
                  >
                    Permasalahan
                  </TableHead>

                  {/* Kolom 4: Pernyataan Risiko (Sticky Left 600px - Batas Freeze) */}
                  <TableHead 
                    style={{ left: 600 }}
                    className="sticky top-0 z-40 bg-slate-100 font-bold text-slate-800 w-[240px] min-w-[240px] max-w-[240px] border-b border-r-2 border-slate-300 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)]"
                  >
                    Pernyataan Risiko
                  </TableHead>

                  {/* Kolom 5 s.d. 14: Kolom yang bergulir di bawah freeze */}
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[120px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Kategori
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[170px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Pemilik Risiko
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[220px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Uraian Penyebab
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[160px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Sumber Penyebab
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[110px] text-center font-bold text-slate-800 border-b border-r border-slate-200">
                    Sifat (C/UC)
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[220px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Uraian Dampak
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[160px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Pihak Terdampak
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[220px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Pengendalian Yg Ada
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[140px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Penilaian
                  </TableHead>
                  <TableHead className="sticky top-0 z-30 bg-slate-100 min-w-[160px] font-bold text-slate-800 border-b border-r border-slate-200">
                    Sisa Risiko
                  </TableHead>

                  {/* Kolom 15: Aksi (Sticky Right 0px) */}
                  <TableHead 
                    style={{ right: 0 }}
                    className="text-center w-[90px] min-w-[90px] max-w-[90px] sticky top-0 right-0 bg-slate-100 border-b border-l border-slate-200 shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.08)] z-40 font-bold text-slate-800"
                  >
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedRisiko.length > 0 ? (
                  groupedRisiko.map((group) => {
                    const isSasaranSame = group.items.every(
                      (it) => (it.sasaranTerkait || "").trim() === (group.items[0]?.sasaranTerkait || "").trim()
                    );

                    return group.items.map((item, idx) => (
                      <TableRow 
                        key={item.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          idx === 0 
                            ? "border-t-2 border-slate-300" 
                            : "border-t border-slate-100"
                        }`}
                      >
                        {/* 1. Indikator Kinerja: FREEZE STICKY LEFT 0px & DITULIS 1 KALI SAJA PER KELOMPOK */}
                        {idx === 0 && (
                          <TableCell 
                            rowSpan={group.items.length} 
                            style={{ left: 0 }}
                            className="sticky left-0 z-20 align-top bg-[#f0f6fd] border-b border-r border-slate-200 p-3.5 w-[220px] min-w-[220px] max-w-[220px]"
                          >
                            <div className="space-y-2 sticky top-12">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
                                  {group.items.length} Risiko
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 leading-snug whitespace-normal break-words">
                                {group.indikatorKinerja}
                              </p>
                            </div>
                          </TableCell>
                        )}

                        {/* 2. Sasaran Terkait: FREEZE STICKY LEFT 220px */}
                        {idx === 0 && isSasaranSame && (
                          <TableCell 
                            rowSpan={group.items.length} 
                            style={{ left: 220 }}
                            className="sticky z-20 align-top bg-slate-50 border-b border-r border-slate-200 p-3.5 w-[200px] min-w-[200px] max-w-[200px]"
                          >
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-normal break-words sticky top-12">
                              {group.sasaranTerkait || "-"}
                            </p>
                          </TableCell>
                        )}
                        {!isSasaranSame && (
                          <TableCell 
                            style={{ left: 220 }}
                            className="sticky z-20 align-top bg-slate-50 border-b border-r border-slate-200 p-3 text-xs text-slate-700 whitespace-normal break-words w-[200px] min-w-[200px] max-w-[200px]"
                          >
                            {item.sasaranTerkait || "-"}
                          </TableCell>
                        )}

                        {/* 3. Permasalahan: FREEZE STICKY LEFT 420px */}
                        <TableCell 
                          style={{ left: 420 }}
                          className="sticky z-20 bg-white border-b border-r border-slate-200 text-xs w-[180px] min-w-[180px] max-w-[180px] align-top text-slate-600 whitespace-normal break-words leading-relaxed p-3" 
                          title={item.permasalahan}
                        >
                          {item.permasalahan || "-"}
                        </TableCell>

                        {/* 4. Pernyataan Risiko: FREEZE STICKY LEFT 600px - BATAS FREEZE DENGAN SHADOW & BORDER */}
                        <TableCell 
                          style={{ left: 600 }}
                          className="sticky z-20 bg-white border-b border-r-2 border-slate-300 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.12)] text-xs w-[240px] min-w-[240px] max-w-[240px] align-top font-semibold text-slate-900 whitespace-normal break-words leading-relaxed p-3" 
                          title={item.pernyataanRisiko}
                        >
                          <div className="flex items-start gap-1.5">
                            {group.items.length > 1 && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0 mt-0.5">
                                #{idx + 1}
                              </span>
                            )}
                            <div className="space-y-1">
                              <span>{item.pernyataanRisiko}</span>
                              {item.catatanAuditor && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded-md">
                                  <AlertCircle className="w-3 h-3 text-pink-600" /> Ada Catatan APIP
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 5. Kategori (Bergulir di bawah freeze) */}
                        <TableCell className="align-top border-b border-r border-slate-200 p-3 min-w-[120px]">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap inline-block">
                            {item.kategori || "-"}
                          </span>
                        </TableCell>

                        {/* 6. Pemilik Risiko */}
                        <TableCell className="text-xs min-w-[170px] max-w-[190px] align-top text-slate-700 whitespace-normal break-words border-b border-r border-slate-200 p-3" title={item.pemilikRisiko}>
                          {item.pemilikRisiko || "-"}
                        </TableCell>

                        {/* 7. Uraian Penyebab */}
                        <TableCell className="text-xs min-w-[220px] max-w-[240px] align-top text-slate-600 whitespace-normal break-words leading-relaxed border-b border-r border-slate-200 p-3" title={item.uraianPenyebab}>
                          {item.uraianPenyebab || "-"}
                        </TableCell>

                        {/* 8. Sumber Penyebab */}
                        <TableCell className="text-xs min-w-[160px] max-w-[180px] align-top text-slate-700 whitespace-normal break-words border-b border-r border-slate-200 p-3" title={item.sumberPenyebab}>
                          {item.sumberPenyebab || "-"}
                        </TableCell>

                        {/* 9. Sifat (C/UC) */}
                        <TableCell className="text-center align-top border-b border-r border-slate-200 p-3 min-w-[110px]">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            item.sifatPenyebab === 'Controllable' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`} title={item.sifatPenyebab}>
                            {item.sifatPenyebab === 'Controllable' ? 'C' : 'UC'}
                          </span>
                        </TableCell>

                        {/* 10. Uraian Dampak */}
                        <TableCell className="text-xs min-w-[220px] max-w-[240px] align-top text-slate-600 whitespace-normal break-words leading-relaxed border-b border-r border-slate-200 p-3" title={item.uraianDampak}>
                          {item.uraianDampak || "-"}
                        </TableCell>

                        {/* 11. Pihak Terdampak */}
                        <TableCell className="text-xs min-w-[160px] max-w-[180px] align-top text-slate-700 whitespace-normal break-words border-b border-r border-slate-200 p-3" title={item.pihakTerdampak}>
                          {item.pihakTerdampak || "-"}
                        </TableCell>

                        {/* 12. Pengendalian Yang Ada */}
                        <TableCell className="text-xs min-w-[220px] max-w-[240px] align-top text-slate-600 whitespace-normal break-words leading-relaxed border-b border-r border-slate-200 p-3" title={item.pengendalianAda}>
                          {item.pengendalianAda || "-"}
                        </TableCell>

                        {/* 13. Penilaian Pengendalian */}
                        <TableCell className="text-xs whitespace-nowrap align-top border-b border-r border-slate-200 p-3 min-w-[140px]">
                          <span className={`px-2 py-1 rounded-md text-[11px] font-medium border inline-block ${
                            item.penilaianPengendalian === 'Sudah Memadai' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {item.penilaianPengendalian || "-"}
                          </span>
                        </TableCell>

                        {/* 14. Sisa Risiko */}
                        <TableCell className="text-xs min-w-[160px] max-w-[180px] align-top font-medium text-slate-700 whitespace-normal break-words border-b border-r border-slate-200 p-3" title={item.sisaRisiko}>
                          {item.sisaRisiko || "-"}
                        </TableCell>
                        
                        {/* 15. Aksi (Sticky Right 0px) */}
                        <TableCell 
                          style={{ right: 0 }}
                          className="text-center align-top sticky right-0 z-20 bg-white border-b border-l border-slate-200 shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.08)] p-2 w-[90px] min-w-[90px] max-w-[90px]"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Edit Risiko" className="h-8 w-8 hover:bg-blue-50">
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-red-50 hover:text-red-700 h-8 w-8 text-red-600" title="Hapus Risiko">
                                <Trash2 className="h-3.5 w-3.5" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Identifikasi Risiko?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus data risiko ini? Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={15} className="h-36 text-center text-slate-500">
                      {searchTerm ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p>Tidak ditemukan risiko yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;.</p>
                          <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                            Reset Pencarian
                          </Button>
                        </div>
                      ) : (
                        `Belum ada data identifikasi risiko untuk tahun anggaran ${activeYear}.`
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Form Identifikasi Risiko */}
      {isFormVisible && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold text-slate-800">
              {isEditMode ? "Edit Identifikasi Risiko" : "Buat Identifikasi Risiko Baru"}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFormVisible(false)} className="text-slate-500">
              <X className="h-4 w-4 mr-2" /> Tutup Form
            </Button>
          </div>

          {formData.catatanAuditor && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-pink-900 text-sm mb-1">
                <AlertCircle className="w-4 h-4 text-pink-600" />
                Catatan Evaluasi / Riviu dari Auditor APIP
              </div>
              <p className="text-xs text-slate-700 mb-2">
                Auditor APIP telah memberikan catatan evaluasi untuk risiko ini. Perhatikan catatan pada kolom-kolom terkait di bawah untuk melakukan revisi.
              </p>
              {formData.catatanPerKolom?.kesimpulan && (
                <div className="bg-white/80 p-2.5 rounded border border-pink-200/60 text-xs text-pink-950">
                  <strong className="text-pink-800 block mb-0.5">Catatan Umum / Kesimpulan Auditor:</strong>
                  {formData.catatanPerKolom.kesimpulan}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            
            {/* Bagian 1: Kinerja & Permasalahan */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">1. Kinerja & Masalah</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="indikatorKinerja">Indikator Sasaran Kinerja *</Label>
                  <Select value={formData.indikatorKinerja} onValueChange={handleIndikatorChange} required>
                    <SelectTrigger id="indikatorKinerja">
                      {formData.indikatorKinerja ? (
                        <span className="line-clamp-3 break-words text-left flex-1 min-w-0">{formData.indikatorKinerja}</span>
                      ) : (
                        <span className="text-slate-500">Pilih Indikator Kinerja...</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {kinerjaList.length === 0 && (
                        <SelectItem value="none" disabled>Tidak ada data indikator</SelectItem>
                      )}
                      {kinerjaList.map(k => (
                        <SelectItem key={k.id} value={k.indikator}>{k.indikator}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.catatanPerKolom?.sasaran && (
                    <div className="p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-900 mt-1 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Catatan Auditor: </strong> {formData.catatanPerKolom.sasaran}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sasaranTerkait">Sasaran Terkait</Label>
                  <Input 
                    id="sasaranTerkait"
                    value={formData.sasaranTerkait} 
                    disabled 
                    className="bg-slate-100 text-slate-700"
                    placeholder="Otomatis terisi..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permasalahan">Permasalahan *</Label>
                <Textarea 
                  id="permasalahan"
                  placeholder="Deskripsikan permasalahan..." 
                  value={formData.permasalahan}
                  onChange={(e) => setFormData({...formData, permasalahan: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Bagian 2: Pernyataan Risiko & Kategori */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">2. Identifikasi Risiko</h4>
              
              <div className="space-y-2">
                <Label htmlFor="pernyataanRisiko">Pernyataan Risiko *</Label>
                <Textarea 
                  id="pernyataanRisiko"
                  placeholder="Kejadian yang mungkin terjadi dan berdampak negatif..." 
                  value={formData.pernyataanRisiko}
                  onChange={(e) => setFormData({...formData, pernyataanRisiko: e.target.value})}
                  required
                />
                {formData.catatanPerKolom?.pernyataanRisiko && (
                  <div className="p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-900 mt-1 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Catatan Auditor: </strong> {formData.catatanPerKolom.pernyataanRisiko}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori Risiko *</Label>
                  <Select 
                    value={formData.kategori} 
                    onValueChange={(val) => setFormData({...formData, kategori: val})} 
                    required
                  >
                    <SelectTrigger id="kategori">
                      {formData.kategori || <span className="text-slate-500">Pilih Kategori...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strategis">Strategis</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                      <SelectItem value="Organisasional">Organisasional</SelectItem>
                      <SelectItem value="Kepatuhan">Kepatuhan</SelectItem>
                      <SelectItem value="Keuangan">Keuangan</SelectItem>
                      <SelectItem value="Fraud">Fraud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pemilikRisiko">Pemilik Risiko *</Label>
                  <Input 
                    id="pemilikRisiko"
                    value={formData.pemilikRisiko}
                    onChange={(e) => setFormData({...formData, pemilikRisiko: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Analisis Penyebab & Dampak */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">3. Analisis Penyebab & Dampak</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="uraianPenyebab">Uraian Penyebab *</Label>
                  <Textarea 
                    id="uraianPenyebab"
                    placeholder="Penyebab terjadinya risiko..." 
                    value={formData.uraianPenyebab}
                    onChange={(e) => setFormData({...formData, uraianPenyebab: e.target.value})}
                    required
                  />
                  {formData.catatanPerKolom?.penyebab && (
                    <div className="p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-900 mt-1 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Catatan Auditor: </strong> {formData.catatanPerKolom.penyebab}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sumberPenyebab">Sumber Penyebab *</Label>
                  <Textarea 
                    id="sumberPenyebab"
                    placeholder="Sumber dari penyebab tersebut..." 
                    value={formData.sumberPenyebab}
                    onChange={(e) => setFormData({...formData, sumberPenyebab: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sifatPenyebab">Sifat (C/UC) *</Label>
                  <Select 
                    value={formData.sifatPenyebab} 
                    onValueChange={(val) => setFormData({...formData, sifatPenyebab: val})} 
                    required
                  >
                    <SelectTrigger id="sifatPenyebab">
                      {formData.sifatPenyebab || <span className="text-slate-500">Pilih Sifat...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Controllable">Controllable (Bisa Dikendalikan)</SelectItem>
                      <SelectItem value="Uncontrollable">Uncontrollable (Tidak Bisa Dikendalikan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="uraianDampak">Uraian Dampak *</Label>
                  <Textarea 
                    id="uraianDampak"
                    placeholder="Dampak jika risiko terjadi..." 
                    value={formData.uraianDampak}
                    onChange={(e) => setFormData({...formData, uraianDampak: e.target.value})}
                    required
                  />
                  {formData.catatanPerKolom?.dampak && (
                    <div className="p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-900 mt-1 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Catatan Auditor: </strong> {formData.catatanPerKolom.dampak}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pihakTerdampak">Pihak yang Terkena Dampak *</Label>
                  <Textarea 
                    id="pihakTerdampak"
                    placeholder="Siapa saja yang terkena dampaknya..." 
                    value={formData.pihakTerdampak}
                    onChange={(e) => setFormData({...formData, pihakTerdampak: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Pengendalian */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-md">4. Pengendalian Risiko</h4>
              
              <div className="space-y-2">
                <Label htmlFor="pengendalianAda">Pengendalian Yang Ada *</Label>
                <Textarea 
                  id="pengendalianAda"
                  placeholder="Langkah pengendalian yang sudah berjalan saat ini..." 
                  value={formData.pengendalianAda}
                  onChange={(e) => setFormData({...formData, pengendalianAda: e.target.value})}
                  required
                />
                {formData.catatanPerKolom?.pengendalian && (
                  <div className="p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-900 mt-1 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Catatan Auditor: </strong> {formData.catatanPerKolom.pengendalian}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="penilaianPengendalian">Penilaian Pengendalian *</Label>
                  <Select 
                    value={formData.penilaianPengendalian} 
                    onValueChange={(val) => setFormData({...formData, penilaianPengendalian: val})} 
                    required
                  >
                    <SelectTrigger id="penilaianPengendalian">
                      {formData.penilaianPengendalian || <span className="text-slate-500">Pilih Penilaian...</span>}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sudah Memadai">Sudah Memadai</SelectItem>
                      <SelectItem value="Belum Memadai">Belum Memadai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sisaRisiko">Sisa Risiko</Label>
                  <Input 
                    id="sisaRisiko"
                    value={formData.sisaRisiko} 
                    disabled 
                    className="bg-slate-100 text-slate-700 font-medium"
                    placeholder="Otomatis dihitung berdasarkan penilaian..."
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terisi otomatis: Jika 'Sudah Memadai' = Tidak ada. Jika 'Belum Memadai' = Pernyataan Risiko.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFormVisible(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Simpan Identifikasi Risiko
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}