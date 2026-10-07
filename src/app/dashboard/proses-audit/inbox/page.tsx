"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MessageSquareWarning, AlertCircle } from "lucide-react";

export default function InboxAuditorPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [risksWithNotes, setRisksWithNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInbox();
  }, [authLoading, user, activeYear]);

  const fetchInbox = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "mr_identifikasi"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", activeYear)
      );
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => {
        const r = { id: d.id, ...d.data() };
        // Hanya ambil yang punya catatan auditor
        if (r.catatanAuditor && r.catatanAuditor.trim() !== "") {
          data.push(r);
        }
      });
      
      // Sort by catatanUpdatedAt if available
      data.sort((a, b) => {
        if (!a.catatanUpdatedAt) return 1;
        if (!b.catatanUpdatedAt) return -1;
        return new Date(b.catatanUpdatedAt).getTime() - new Date(a.catatanUpdatedAt).getTime();
      });
      
      setRisksWithNotes(data);
    } catch (error) {
      console.error("Fetch inbox error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Inbox Hasil Auditor</h2>
        <p className="text-slate-500">Daftar catatan dan masukan dari Auditor APIP terkait Peta Risiko Anda tahun {activeYear}.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : risksWithNotes.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Belum Ada Catatan Auditor</h3>
          <p className="text-emerald-600 max-w-md mx-auto">
            Bagus! Saat ini tidak ada catatan perbaikan atau temuan dari Auditor untuk Peta Risiko unit kerja Anda pada tahun {activeYear}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {risksWithNotes.map((risk) => (
            <Card key={risk.id} className="border-pink-200 shadow-sm overflow-hidden">
              <div className="bg-pink-600 h-1 w-full"></div>
              <CardHeader className="pb-3 bg-pink-50/50">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardDescription className="text-pink-600 font-semibold mb-1 flex items-center">
                      <MessageSquareWarning className="w-4 h-4 mr-2" />
                      Catatan Masuk
                    </CardDescription>
                    <CardTitle className="text-lg leading-tight">{risk.pernyataanRisiko}</CardTitle>
                  </div>
                  {risk.catatanUpdatedAt && (
                    <span className="text-xs text-slate-400 whitespace-nowrap bg-white px-2 py-1 rounded-md border shadow-sm">
                      {new Date(risk.catatanUpdatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg mb-4">
                  <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Pesan / Riviu Auditor:</div>
                  <div className="text-slate-800 whitespace-pre-wrap">{risk.catatanAuditor}</div>
                </div>
                
                <div className="text-sm bg-white border border-indigo-100 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block text-xs">Sasaran Terkait:</span>
                      <span className="font-medium text-slate-700">{risk.sasaranTerkait}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Rencana Tindak Pengendalian:</span>
                      {risk.rtpList && risk.rtpList.length > 0 ? (
                        <ul className="list-disc pl-4 text-slate-700">
                          {risk.rtpList.map((rtp: any, idx: number) => (
                            <li key={idx} className="line-clamp-1">{rtp.rencana}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada RTP</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <a href="/dashboard/mr-identifikasi" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                    Pergi ke Identifikasi Risiko untuk memperbaiki &rarr;
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
