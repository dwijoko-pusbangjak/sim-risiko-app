"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, History, UserCircle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityLog {
  id: string;
  email: string;
  unitName: string;
  role: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export default function ActivityLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "activity_logs"), 
        orderBy("createdAt", "desc"),
        limit(200) // Batasi agar tidak terlalu berat
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Log Aktivitas Pengguna</h2>
        <p className="text-slate-500">Memantau rekam jejak setiap aksi yang dilakukan oleh seluruh pengguna di aplikasi.</p>
      </div>

      <Card className="border-slate-200 shadow-sm animate-in fade-in zoom-in-95">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="flex items-center text-lg">
            <History className="mr-2 h-5 w-5 text-indigo-600" /> Riwayat Aktivitas Terbaru
          </CardTitle>
          <CardDescription>Menampilkan 200 log aktivitas terakhir dari sistem.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar max-h-[70vh]">
            <Table>
              <TableHeader className="bg-slate-100/50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px]">Waktu</TableHead>
                  <TableHead className="min-w-[200px]">Pengguna</TableHead>
                  <TableHead className="w-[150px]">Modul</TableHead>
                  <TableHead className="w-[120px]">Aksi</TableHead>
                  <TableHead className="min-w-[300px]">Keterangan Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-600 whitespace-nowrap">
                        {formatTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={log.unitName}>
                              {log.unitName}
                            </span>
                            <span className="text-[11px] text-slate-500">{log.email}</span>
                            {log.ipAddress && (
                               <span className="text-[10px] text-indigo-500 font-mono mt-0.5" title="IP Address">IP: {log.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                          {log.module}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                          log.action === 'Login' ? 'text-emerald-600' :
                          log.action === 'Tambah' || log.action === 'Simpan' ? 'text-blue-600' :
                          log.action === 'Hapus' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          <Activity className="h-3.5 w-3.5" />
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm whitespace-pre-wrap">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                      Belum ada log aktivitas yang tercatat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
