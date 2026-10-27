"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareWarning, AlertCircle, CheckCircle2, Clock, Send, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function InboxAuditorPage() {
  const { user, activeYear, loading: authLoading } = useAuth();
  
  const [risksWithNotes, setRisksWithNotes] = useState<any[]>([]);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchInbox();
  }, [authLoading, user, activeYear]);

  const fetchInbox = async () => {
    const safeYear = activeYear || new Date().getFullYear().toString();
    if (!user?.unitName) return;
    setIsLoading(true);
    try {
      // 1. Fetch submission data from audit_submissions
      const subDocId = `${user.unitName.replace(/\s+/g, '_')}_${safeYear}`;
      const subSnap = await getDoc(doc(db, "audit_submissions", subDocId));
      let sub: any = null;
      if (subSnap.exists()) {
        sub = subSnap.data();
      }
      setSubmissionData(sub);

      // 2. Fetch risks if submission has been reviewed by auditor
      const q = query(
        collection(db, "mr_identifikasi"),
        where("unitName", "==", user.unitName),
        where("tahun", "==", safeYear)
      );
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => {
        const r = { id: d.id, ...d.data() };
        // Only include if has catatanAuditor
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

  const safeYear = activeYear || new Date().getFullYear().toString();
  const isReviewed = submissionData && submissionData.status === "reviewed";

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Inbox Hasil Auditor</h2>
        <p className="text-slate-500">Daftar catatan dan hasil evaluasi dari Auditor APIP terkait Peta Risiko unit kerja Anda tahun {safeYear}.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : !isReviewed ? (
        // Kasus: Belum Dikirim atau Masih dalam Proses Riviu oleh Auditor
        submissionData?.status === "submitted" ? (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-blue-900">Peta Risiko Sedang Direviu oleh Auditor</h3>
              <p className="text-sm text-blue-700">
                Dokumen Anda telah terkirim pada{" "}
                <span className="font-semibold">
                  {submissionData.submittedAt ? new Date(submissionData.submittedAt).toLocaleString("id-ID") : "-"}
                </span>{" "}
                dan saat ini sedang dalam proses peninjauan oleh Auditor APIP.
              </p>
              <p className="text-xs text-blue-600 italic">
                Catatan perbaikan akan otomatis muncul di halaman ini setelah Auditor menekan tombol &ldquo;Kirim ke Unit Kerja&rdquo;.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-lg mx-auto space-y-2">
              <h3 className="text-xl font-bold text-amber-900">Peta Risiko Belum Dikirim ke Auditor</h3>
              <p className="text-sm text-amber-700">
                Unit kerja Anda belum mengirimkan Peta Risiko Tahun {safeYear} ke Auditor APIP.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/proses-audit/kirim">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Buka Menu Kirim ke Auditor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )
      ) : (
        // Kasus: SUDAH DIKIRIM OLEH AUDITOR (status: 'reviewed')
        <div className="space-y-6">
          {/* Header Banner Hasil Riviu */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hasil Riviu Telah Diterima dari Auditor APIP
                </div>
                <h3 className="text-lg font-bold text-slate-800">Evaluasi Peta Risiko Tahun {safeYear}</h3>
                <p className="text-xs text-slate-600">
                  Direviu oleh: <span className="font-semibold text-slate-800">{submissionData.reviewedBy || "Auditor APIP"}</span>
                  {submissionData.reviewedAt && (
                    <> • Tanggal: <span className="font-semibold text-slate-800">{new Date(submissionData.reviewedAt).toLocaleString("id-ID")}</span></>
                  )}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Catatan Perbaikan:</span>
                <span className="text-2xl font-black text-pink-700">{risksWithNotes.length} Risiko</span>
              </div>
            </div>

            {submissionData.catatanUmum && (
              <div className="mt-4 pt-4 border-t border-emerald-200/60 bg-white/70 p-3.5 rounded-lg">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Catatan / Rekomendasi Umum Auditor:
                </span>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{submissionData.catatanUmum}</p>
              </div>
            )}
          </div>

          {/* List Risiko yang Memiliki Catatan */}
          {risksWithNotes.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-10 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900">Peta Risiko Disetujui Tanpa Catatan Revisi</h3>
              <p className="text-sm text-emerald-700 max-w-md mx-auto">
                Auditor APIP telah mengevaluasi dokumen Peta Risiko Anda dan tidak memberikan catatan perbaikan khusus pada risiko.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Daftar Risiko yang Perlu Ditindaklanjuti ({risksWithNotes.length})</span>
                <Link href="/dashboard/mr-identifikasi">
                  <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    Buka Identifikasi Risiko <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4">
                {risksWithNotes.map((risk) => (
                  <Card key={risk.id} className="border-pink-200 shadow-xs overflow-hidden">
                    <div className="bg-pink-600 h-1.5 w-full"></div>
                    <CardHeader className="pb-3 bg-pink-50/40">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardDescription className="text-pink-700 font-semibold text-xs flex items-center">
                            <MessageSquareWarning className="w-3.5 h-3.5 mr-1.5" />
                            Catatan Masuk dari Auditor
                          </CardDescription>
                          <CardTitle className="text-base text-slate-900 leading-snug">{risk.pernyataanRisiko}</CardTitle>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                          risk.levelRisiko === 'Sangat Tinggi' ? 'bg-red-100 text-red-800' :
                          risk.levelRisiko === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                          risk.levelRisiko === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                          risk.levelRisiko === 'Rendah' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {risk.levelRisiko || "Risiko"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Box Catatan Auditor */}
                      <div className="bg-pink-50/70 border border-pink-200 p-4 rounded-lg">
                        <div className="text-xs text-pink-900 mb-1 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span>Catatan Perbaikan:</span>
                        </div>
                        <div className="text-slate-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                          {risk.catatanAuditor}
                        </div>
                      </div>
                      
                      {/* Detail Pendukung */}
                      <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                        {risk.sasaranTerkait && (
                          <div>
                            <span className="text-slate-500 font-semibold block">Sasaran Terkait:</span>
                            <span className="text-slate-700">{risk.sasaranTerkait}</span>
                          </div>
                        )}
                        {risk.uraianPenyebab && (
                          <div>
                            <span className="text-slate-500 font-semibold block">Penyebab:</span>
                            <span className="text-slate-700">{risk.uraianPenyebab}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500 font-semibold block">Rencana Tindak Pengendalian (RTP):</span>
                          {risk.rtpList && risk.rtpList.length > 0 ? (
                            <ul className="list-disc pl-4 text-slate-700 mt-0.5 space-y-0.5">
                              {risk.rtpList.map((rtp: any, idx: number) => (
                                <li key={idx}>
                                  <span className="font-medium">{rtp.rencana}</span>
                                  {(rtp.penanggungjawab || rtp.targetWaktu) && (
                                    <span className="text-slate-500"> (PJ: {rtp.penanggungjawab || "-"}, Target: {rtp.targetWaktu || "-"})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-slate-400 italic">Belum ada RTP</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-1">
                        <Link 
                          href="/dashboard/mr-identifikasi" 
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                        >
                          Perbaiki Risiko Ini di Menu Identifikasi Risiko &rarr;
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Alert Pengiriman Ulang */}
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-sm text-indigo-900">
                  <span className="font-bold block">Sudah selesai memperbaiki peta risiko Anda?</span>
                  <span>Anda dapat mengirimkan kembali dokumen peta risiko yang telah diperbaiki ke Auditor APIP.</span>
                </div>
                <Link href="/dashboard/proses-audit/kirim">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap">
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Ulang ke Auditor
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
