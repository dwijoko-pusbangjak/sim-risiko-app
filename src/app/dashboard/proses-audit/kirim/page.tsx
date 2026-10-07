"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";

export default function KirimAuditorPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [submissionStatus, setSubmissionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [riskCount, setRiskCount] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;
    checkStatus();
  }, [authLoading, user, activeYear]);

  const checkStatus = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check submission status
      const q = query(
        collection(db, "audit_submissions"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", activeYear)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSubmissionStatus({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setSubmissionStatus(null);
      }
      
      // Check total risks available to send
      const rq = query(
        collection(db, "mr_identifikasi"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", activeYear)
      );
      const rSnap = await getDocs(rq);
      setRiskCount(rSnap.size);
      
    } catch (error) {
      console.error("Check status error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user) return;
    if (riskCount === 0) {
      toast.error("Tidak ada data Peta Risiko untuk tahun ini.");
      return;
    }
    
    if (!confirm(`Anda yakin ingin mengirim Peta Risiko Tahun ${activeYear} ke Auditor APIP?`)) return;
    
    setIsSending(true);
    const toastId = toast.loading("Mengirim dokumen ke Auditor...");
    
    try {
      const docId = `${user.unitName.replace(/\\s+/g, '_')}_${activeYear}`;
      const submissionData = {
        unitName: user.unitName,
        tahun: activeYear,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submittedBy: user.name || user.email
      };
      
      await setDoc(doc(db, "audit_submissions", docId), submissionData);
      setSubmissionStatus({ id: docId, ...submissionData });
      
      logActivity(user, "Kirim", "Proses Audit", `Mengirim peta risiko tahun ${activeYear} ke auditor`);
      toast.success("Berhasil dikirim ke Auditor!", { id: toastId });
    } catch (error) {
      console.error("Send error", error);
      toast.error("Gagal mengirim dokumen.", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Kirim Peta Risiko ke Auditor</h2>
        <p className="text-slate-500">Kirimkan dokumen Manajemen Risiko unit kerja Anda untuk dievaluasi oleh APIP / Auditor.</p>
      </div>

      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-50">
          <CardTitle className="text-xl">Status Pengiriman (Tahun {activeYear})</CardTitle>
          <CardDescription>Unit Kerja: {user?.unitName}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8 py-4">
              <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
                  <span className="font-medium text-slate-700">Total Risiko Teridentifikasi</span>
                  <span className="text-xl font-bold text-indigo-600">{riskCount}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border">
                  <span className="font-medium text-slate-700">Status Saat Ini</span>
                  {submissionStatus ? (
                    <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Sudah Dikirim
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Belum Dikirim
                    </span>
                  )}
                </div>

                {submissionStatus && (
                  <div className="text-sm text-slate-500 text-right">
                    Dikirim pada: {new Date(submissionStatus.submittedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t justify-end py-4">
          <Button 
            onClick={handleSend} 
            disabled={isSending || isLoading || !!submissionStatus || riskCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {submissionStatus ? "Sudah Terkirim" : "Kirim ke Auditor Sekarang"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
