"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/logger";
import Link from "next/link";

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
    const safeYear = activeYear || new Date().getFullYear().toString();
    
    try {
      // 1. Check total risks available to send FIRST
      const rq = query(
        collection(db, "mr_identifikasi"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const rSnap = await getDocs(rq);
      setRiskCount(rSnap.size);
      
      // 2. Then check submission status
      const q = query(
        collection(db, "audit_submissions"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setSubmissionStatus({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setSubmissionStatus(null);
      }
      
    } catch (error: any) {
      console.error("Check status error", error);
      toast.error("Gagal memuat status: " + (error?.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!user) return;
    const safeYear = activeYear || new Date().getFullYear().toString();
    
    const isResubmit = submissionStatus?.status === "reviewed";
    const confirmMessage = isResubmit
      ? `Anda yakin ingin mengirim ulang Peta Risiko Tahun ${safeYear} ke Auditor setelah melakukan perbaikan?`
      : `Anda yakin ingin mengirim Peta Risiko Tahun ${safeYear} ke Auditor APIP?`;

    if (riskCount === 0) {
      if (!confirm("Peringatan: Sistem mendeteksi 0 risiko untuk tahun ini. Yakin ingin mengirim dokumen kosong?")) return;
    } else {
      if (!confirm(confirmMessage)) return;
    }
    
    setIsSending(true);
    const toastId = toast.loading("Mengirim dokumen ke Auditor...");
    
    try {
      const cleanDocId = `${user.unitName.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
      const legacyDocId = `${user.unitName.replace(/\s+/g, '_')}_${safeYear}`;
      const submissionData = {
        unitName: user.unitName,
        tahun: safeYear,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submittedBy: user.name || user.email,
        isResubmission: isResubmit
      };
      
      await setDoc(doc(db, "audit_submissions", cleanDocId), submissionData, { merge: true });
      if (legacyDocId !== cleanDocId) {
        try {
          await setDoc(doc(db, "audit_submissions", legacyDocId), submissionData, { merge: true });
        } catch (e) {}
      }

      // Update auditStatus pada setiap risiko mr_identifikasi
      try {
        const rq = query(
          collection(db, "mr_identifikasi"),
          where("unitName", "==", user.unitName),
          where("tahun", "==", safeYear)
        );
        const rSnap = await getDocs(rq);
        for (const d of rSnap.docs) {
          try {
            await updateDoc(doc(db, "mr_identifikasi", d.id), {
              auditStatus: "submitted",
              submittedAt: new Date().toISOString()
            });
          } catch (err) {}
        }
      } catch (err) {
        console.warn("Update risk docs status failed", err);
      }

      setSubmissionStatus({ id: cleanDocId, ...submissionData });
      
      logActivity(user, "Kirim", "Proses Audit", `Mengirim peta risiko tahun ${safeYear} ke auditor`);
      toast.success(isResubmit ? "Peta risiko berhasil dikirim ulang ke Auditor!" : "Berhasil dikirim ke Auditor!", { id: toastId });
    } catch (error) {
      console.error("Send error", error);
      toast.error("Gagal mengirim dokumen.", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500">Memuat...</div>;

  const isReviewed = submissionStatus?.status === "reviewed";
  const isSubmitted = submissionStatus?.status === "submitted";

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Kirim Peta Risiko ke Auditor</h2>
        <p className="text-slate-500">Kirimkan dokumen Manajemen Risiko unit kerja Anda untuk dievaluasi oleh APIP / Auditor.</p>
      </div>

      <Card className="border-indigo-100 shadow-md">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-50">
          <CardTitle className="text-xl">Status Pengiriman (Tahun {activeYear || new Date().getFullYear().toString()})</CardTitle>
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
                  {isReviewed ? (
                    <span className="flex items-center text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Telah Direviu oleh Auditor
                    </span>
                  ) : isSubmitted ? (
                    <span className="flex items-center text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      <Clock className="w-4 h-4 mr-2" />
                      Sedang Direviu oleh Auditor
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Belum Dikirim
                    </span>
                  )}
                </div>

                {isReviewed && (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-900 flex items-center justify-between">
                    <span>Hasil riviu dan catatan perbaikan telah tersedia di Inbox.</span>
                    <Link href="/dashboard/proses-audit/inbox" className="font-semibold underline hover:text-purple-950">
                      Lihat Catatan di Inbox &rarr;
                    </Link>
                  </div>
                )}

                {submissionStatus?.submittedAt && (
                  <div className="text-sm text-slate-500 text-right">
                    Terakhir dikirim pada: {new Date(submissionStatus.submittedAt).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-slate-50 border-t justify-end py-4">
          <Button 
            onClick={handleSend} 
            disabled={isSending || isLoading || isSubmitted}
            className="bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isResubmit ? (
              <RefreshCw className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitted 
              ? "Sedang Direviu oleh Auditor" 
              : isResubmit 
              ? "Kirim Ulang ke Auditor (Setelah Perbaikan)" 
              : "Kirim ke Auditor Sekarang"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
