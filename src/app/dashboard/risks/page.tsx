"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Firebase imports
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// Definisi tipe data Risiko
interface RiskData {
  id: string;
  peristiwa: string;
  kategori: string;
  penyebab: string;
  probabilitas: number;
  dampak: number;
  skor: number;
  level: string;
  unitName: string;
  ownerId: string;
  createdAt: any;
}

export default function RiskRegisterPage() {
  const { user } = useAuth();
  
  // State untuk data dan tabel
  const [risks, setRisks] = useState<RiskData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    peristiwa: "",
    kategori: "",
    penyebab: "",
    probabilitas: 1,
    dampak: 1,
  });

  // Fungsi untuk mengambil data dari Firestore
  const fetchRisks = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const risksRef = collection(db, "risks");
      let q;

      // Filter berdasarkan role: Admin lihat semua, Eselon lihat unitnya saja
      if (user.role === "admin") {
        q = query(risksRef); 
      } else {
        q = query(risksRef, where("unitName", "==", user.unitName || ""));
      }

      const querySnapshot = await getDocs(q);
      const fetchedRisks: RiskData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRisks.push({ ...doc.data(), id: doc.id } as RiskData);
      });
      
      // Urutkan secara manual (karena butuh composite index jika order di dalam query)
      fetchedRisks.sort((a, b) => b.skor - a.skor);
      setRisks(fetchedRisks);
    } catch (error) {
      console.error("Gagal mengambil data risiko:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [user]);

  // Penentuan Level Risiko
  const getRiskLevel = (skor: number) => {
    if (skor >= 15) return "Tinggi";
    if (skor >= 8) return "Sedang";
    return "Rendah";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Tinggi": return "bg-red-100 text-red-800 border-red-200";
      case "Sedang": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Rendah": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  // Handler Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    const prob = Number(formData.probabilitas);
    const dmpk = Number(formData.dampak);
    const skorHitung = prob * dmpk;

    try {
      await addDoc(collection(db, "risks"), {
        peristiwa: formData.peristiwa,
        kategori: formData.kategori,
        penyebab: formData.penyebab,
        probabilitas: prob,
        dampak: dmpk,
        skor: skorHitung,
        level: getRiskLevel(skorHitung),
        ownerId: user.uid,
        unitName: user.unitName || "Tidak Diketahui",
        createdAt: serverTimestamp(),
      });
      
      // Reset form dan tutup modal
      setFormData({ peristiwa: "", kategori: "", penyebab: "", probabilitas: 1, dampak: 1 });
      setIsModalOpen(false);
      
      // Refresh tabel
      fetchRisks();
    } catch (error) {
      console.error("Error menambah data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter pencarian
  const filteredRisks = risks.filter(r => 
    r.peristiwa.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Risk Register</h2>
          <p className="text-slate-500">Daftar identifikasi risiko program dan wilayah.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-emerald-600 text-white hover:bg-emerald-700 h-10 py-2 px-4">
            <Plus className="mr-2 h-4 w-4" /> Tambah Risiko Baru
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Input Risiko Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail peristiwa risiko, penyebab, dan taksiran awal probabilitas (1-5) & dampak (1-5).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="peristiwa">Peristiwa Risiko *</Label>
                  <Textarea 
                    id="peristiwa" 
                    required
                    placeholder="Deskripsikan kejadian yang berisiko..." 
                    value={formData.peristiwa}
                    onChange={(e) => setFormData({...formData, peristiwa: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="kategori">Kategori *</Label>
                    <Input 
                      id="kategori" 
                      required
                      placeholder="Contoh: Keuangan, Operasional" 
                      value={formData.kategori}
                      onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="penyebab">Penyebab Utama *</Label>
                    <Input 
                      id="penyebab" 
                      required
                      placeholder="..." 
                      value={formData.penyebab}
                      onChange={(e) => setFormData({...formData, penyebab: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="prob">Probabilitas (1-5) *</Label>
                    <Input 
                      id="prob" 
                      type="number" min="1" max="5" required
                      value={formData.probabilitas}
                      onChange={(e) => setFormData({...formData, probabilitas: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dampak">Dampak (1-5) *</Label>
                    <Input 
                      id="dampak" 
                      type="number" min="1" max="5" required
                      value={formData.dampak}
                      onChange={(e) => setFormData({...formData, dampak: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                {/* Preview Skor Otomatis */}
                <div className="mt-2 p-3 bg-slate-50 border rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Proyeksi Skor Risiko (PxD):</span>
                  <span className="text-lg font-bold text-slate-800">
                    {formData.probabilitas * formData.dampak} 
                    <span className="text-sm font-normal ml-2 text-slate-500">
                      ({getRiskLevel(formData.probabilitas * formData.dampak)})
                    </span>
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Data"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pencarian dan Filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Cari peristiwa atau kategori..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel Data */}
      <div className="rounded-md border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Peristiwa Risiko</TableHead>
              <TableHead>Kategori</TableHead>
              {user?.role === "admin" && <TableHead>Unit Kerja</TableHead>}
              <TableHead className="text-center">Probabilitas</TableHead>
              <TableHead className="text-center">Dampak</TableHead>
              <TableHead className="text-center">Skor (PxD)</TableHead>
              <TableHead className="text-center">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={user?.role === "admin" ? 7 : 6} className="h-24 text-center text-slate-500">
                  <div className="flex justify-center items-center"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data...</div>
                </TableCell>
              </TableRow>
            ) : filteredRisks.length > 0 ? (
              filteredRisks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium max-w-[250px] truncate" title={risk.peristiwa}>
                    {risk.peristiwa}
                  </TableCell>
                  <TableCell>{risk.kategori}</TableCell>
                  {user?.role === "admin" && (
                    <TableCell className="text-slate-500 text-sm">
                      {risk.unitName}
                    </TableCell>
                  )}
                  <TableCell className="text-center">{risk.probabilitas}</TableCell>
                  <TableCell className="text-center">{risk.dampak}</TableCell>
                  <TableCell className="text-center font-bold">{risk.skor}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getLevelColor(risk.level)}`}>
                      {risk.level}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={user?.role === "admin" ? 7 : 6} className="h-24 text-center text-slate-500">
                  Belum ada data risiko. Silakan tambahkan risiko baru.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
