"use client";

import { useState, useRef, useEffect } from "react";
import { collection, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Download, Upload, DatabaseBackup, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

const COLLECTIONS = [
  "users",
  "units",
  "sasaran_strategis",
  "sasaran_program",
  "sasaran_kegiatan",
  "mr_konteks",
  "mr_identifikasi",
  "activity_logs",
  "settings"
];

export default function BackupRestorePage() {
  const { user, loading: authLoading } = useAuth();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validasi akses Admin
  if (!authLoading && user && user.role !== "admin") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-slate-500 font-medium text-lg">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan data backup...");
    
    try {
      const backupData: Record<string, any> = {};
      
      for (const colName of COLLECTIONS) {
        const querySnapshot = await getDocs(collection(db, colName));
        const colData: any[] = [];
        querySnapshot.forEach((docSnap) => {
          colData.push({ id: docSnap.id, ...docSnap.data() });
        });
        backupData[colName] = colData;
      }
      
      const backupString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split("T")[0];
      const link = document.createElement("a");
      link.href = url;
      link.download = `simrisiko_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logActivity(user, "Backup", "Sistem", "Melakukan unduh backup data (JSON)");
      toast.success("Backup data berhasil diunduh!", { id: toastId });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal melakukan backup data.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERINGATAN! Proses ini akan MENIMPA data yang ada dengan data dari file backup. Data saat ini yang memiliki ID sama akan berubah. Apakah Anda yakin ingin melanjutkan?")) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading("Memulihkan data... Mohon jangan tutup halaman ini.");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsedData = JSON.parse(content);
          
          let totalImported = 0;
          
          // Using a simple sequence of writes instead of batches since we might exceed 500 limit
          // A safer approach: write sequentially or chunked.
          for (const colName of COLLECTIONS) {
            if (parsedData[colName] && Array.isArray(parsedData[colName])) {
              const items = parsedData[colName];
              
              // We'll write them directly document by document (good for small/medium DBs)
              for (const item of items) {
                const docId = item.id;
                // Exclude 'id' from data if we are putting it inside doc
                const { id, ...dataToSave } = item; 
                
                await setDoc(doc(db, colName, docId), dataToSave);
                totalImported++;
              }
            }
          }
          
          logActivity(user, "Restore", "Sistem", `Melakukan pemulihan (restore) ${totalImported} dokumen`);
          toast.success(`Berhasil memulihkan ${totalImported} data!`, { id: toastId });
        } catch (err) {
          console.error("Parse/Import error:", err);
          toast.error("Format file tidak valid atau gagal menyimpan data.", { id: toastId });
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      
      reader.onerror = () => {
        toast.error("Gagal membaca file backup.", { id: toastId });
        setIsImporting(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error("Import start error:", error);
      toast.error("Gagal memulai proses restore.", { id: toastId });
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Backup & Restore</h2>
        <p className="text-slate-500">
          Amankan data aplikasi Anda dengan mengunduh file backup, atau pulihkan data dari file backup sebelumnya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD BACKUP */}
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              Backup Data
            </CardTitle>
            <CardDescription>
              Unduh seluruh data (Pengguna, Unit, Sasaran, Konteks, Risiko, dll.) ke dalam satu file .json. Simpan file ini di tempat yang aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 mb-2">
              <p className="text-sm text-emerald-800 font-medium">
                Sangat disarankan untuk melakukan backup secara berkala (misal: setiap akhir periode/tahun).
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleExport} 
              disabled={isExporting} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DatabaseBackup className="w-4 h-4 mr-2" />}
              {isExporting ? "Menyiapkan Backup..." : "Unduh Data Backup (.json)"}
            </Button>
          </CardFooter>
        </Card>

        {/* CARD RESTORE */}
        <Card className="border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-600" />
              Restore Data
            </CardTitle>
            <CardDescription>
              Pulihkan data dari file .json yang pernah Anda unduh sebelumnya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-start gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-bold mb-1">Peringatan Kritis!</p>
                <p>Melakukan restore akan <b>MENIMPA</b> data saat ini yang memiliki ID yang sama dengan data di dalam file backup. Pastikan Anda mengunggah file yang benar.</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isImporting} 
              variant="outline"
              className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isImporting ? "Memulihkan Data..." : "Unggah & Pulihkan Data"}
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
