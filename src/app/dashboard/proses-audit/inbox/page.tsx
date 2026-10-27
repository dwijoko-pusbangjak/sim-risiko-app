"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareWarning, AlertCircle, CheckCircle2, Clock, Send, ArrowRight, ShieldCheck, RefreshCw, FileText, Check } from "lucide-react";
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
      const unitName = user.unitName;
      const cleanUnit = unitName.trim();

      // 1. Ambil data submission status
      let sub: any = null;
      try {
        const subQ = query(
          collection(db, "audit_submissions"),
          where("unitName", "==", unitName),
          where("tahun", "==", safeYear)
        );
        const subSnap = await getDocs(subQ);
        if (!subSnap.empty) {
          sub = subSnap.docs[0].data();
        } else if (cleanUnit !== unitName) {
          const subQ2 = query(
            collection(db, "audit_submissions"),
            where("unitName", "==", cleanUnit),
            where("tahun", "==", safeYear)
          );
          const subSnap2 = await getDocs(subQ2);
          if (!subSnap2.empty) sub = subSnap2.docs[0].data();
        }

        // Fallback docId
        if (!sub) {
          const cleanDocId = `${cleanUnit.replace(/[^a-zA-Z0-9]/g, '_')}_${safeYear}`;
          const dSnap = await getDoc(doc(db, "audit_submissions", cleanDocId));
          if (dSnap.exists()) {
            sub = dSnap.data();
          } else {
            const legacyDocId = `${cleanUnit.replace(/\s+/g, '_')}_${safeYear}`;
            const legSnap = await getDoc(doc(db, "audit_submissions", legacyDocId));
            if (legSnap.exists()) sub = legSnap.data();
          }
        }
      } catch (e) {
        console.warn("Gagal fetch submission status", e);
      }
      setSubmissionData(sub);

      // 2. Ambil data risiko yang memiliki catatan auditor
      let foundRisks: any[] = [];
      try {
        const q = query(
          collection(db, "mr_identifikasi"),
          where("unitName", "==", unitName),
          where("tahun", "==", safeYear)
        );
        const snap = await getDocs(q);
        snap.forEach(d => {
          const r = { id: d.id, ...d.data() };
          const hasColNotes = r.catatanPerKolom && Object.values(r.catatanPerKolom).some((v: any) => v && v.trim() !== "");
          const hasLegacyNotes = r.catatanAuditor && r.catatanAuditor.trim() !== "";
          if (hasColNotes || hasLegacyNotes) {
            foundRisks.push(r);
          }
        });

        // Fallback query jika cleanUnit berbeda
        if (foundRisks.length === 0 && cleanUnit !== unitName) {
          const q2 = query(
            collection(db, "mr_identifikasi"),
            where("unitName", "==", cleanUnit),
            where("tahun", "==", safeYear)
          );
          const snap2 = await getDocs(q2);
          snap2.forEach(d => {
            const r = { id: d.id, ...d.data() };
            const hasColNotes = r.catatanPerKolom && Object.values(r.catatanPerKolom).some((v: any) => v && v.trim() !== "");
            const hasLegacyNotes = r.catatanAuditor && r.catatanAuditor.trim() !== "";
            if (hasColNotes || hasLegacyNotes) {
              foundRisks.push(r);
            }
          });
        }
      } catch (e) {
        console.error("Gagal fetch risiko di inbox", e);
      }

      // Sortir berdasarkan tanggal catatan terbaru
      foundRisks.sort((a, b) => {
        if (!a.catatanUpdatedAt) return 1;
        if (!b.catatanUpdatedAt) return -1;
        return new Date(b.catatanUpdatedAt).getTime() - new Date(a.catatanUpdatedAt).getTime();
      });

      setRisksWithNotes(foundRisks);
    } catch (error) {
      console.error("Fetch inbox error", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="p-8 text-center text-slate-500">Memuat...</div>;

  const safeYear = activeYear || new Date().getFullYear().toString();
  const hasNotes = risksWithNotes.length > 0;
  const isReviewed = hasNotes || (submissionData && submissionData.status === "reviewed");

  return (
    <div className="space-y-6 max-w-5xl mx-auto mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Inbox Hasil Auditor</h2>
          <p className="text-slate-500">Daftar catatan dan hasil evaluasi per kolom dari Auditor APIP terkait Peta Risiko unit kerja Anda tahun {safeYear}.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchInbox} 
          disabled={isLoading}
          className="self-start sm:self-auto text-slate-600 hover:text-slate-900 border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan Data
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : !isReviewed ? (
        // Kasus: Belum Dikirim atau Masih dalam Proses Riviu oleh Auditor (dan belum ada catatan)
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
        // Kasus: ADA CATATAN RIVIU DARI AUDITOR
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
                  Direviu oleh: <span className="font-semibold text-slate-800">{submissionData?.reviewedBy || "Auditor APIP"}</span>
                  {submissionData?.reviewedAt && (
                    <> • Tanggal: <span className="font-semibold text-slate-800">{new Date(submissionData.reviewedAt).toLocaleString("id-ID")}</span></>
                  )}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Risiko Perlu Revisi:</span>
                <span className="text-2xl font-black text-pink-700">{risksWithNotes.length} Risiko</span>
              </div>
            </div>

            {submissionData?.catatanUmum && (
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">Daftar Risiko yang Perlu Ditindaklanjuti ({risksWithNotes.length})</span>
                <Link href="/dashboard/mr-identifikasi">
                  <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    Buka Identifikasi Risiko <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-6">
                {risksWithNotes.map((risk) => {
                  const cp = risk.catatanPerKolom;
                  const hasDetailColumns = cp && Object.values(cp).some((v: any) => v && v.trim() !== "");

                  return (
                    <Card key={risk.id} className="border-pink-200 shadow-xs overflow-hidden">
                      <div className="bg-pink-600 h-1.5 w-full"></div>
                      <CardHeader className="pb-3 bg-pink-50/40">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <CardDescription className="text-pink-700 font-semibold text-xs flex items-center">
                              <MessageSquareWarning className="w-3.5 h-3.5 mr-1.5" />
                              Catatan Masuk dari Auditor
                            </CardDescription>
                            <CardTitle className="text-base text-slate-900 leading-snug">{risk.pernyataanRisiko}</CardTitle>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap self-start ${
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
                        {/* RIVIU DETAIL PER KOLOM (Jika Ada) */}
                        {hasDetailColumns ? (
                          <div className="space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                              Catatan Riviu per Kolom:
                            </span>

                            {/* 1. Sasaran & Indikator */}
                            {cp?.sasaran?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Sasaran & Indikator Kinerja
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  {risk.sasaranTerkait || "-"} • {risk.indikatorKinerja || "-"}
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.sasaran}
                                </div>
                              </div>
                            )}

                            {/* 2. Pernyataan Risiko & Kategori */}
                            {cp?.pernyataanRisiko?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Pernyataan Risiko & Kategori
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  {risk.pernyataanRisiko} (Kategori: {risk.kategori || "-"})
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.pernyataanRisiko}
                                </div>
                              </div>
                            )}

                            {/* 3. Penyebab Risiko */}
                            {cp?.penyebab?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Penyebab Risiko
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  {risk.uraianPenyebab || "-"} (Sumber: {risk.sumberPenyebab || "-"}, Sifat: {risk.sifatPenyebab || "-"})
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.penyebab}
                                </div>
                              </div>
                            )}

                            {/* 4. Dampak Risiko */}
                            {cp?.dampak?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Dampak Risiko & Pihak Terdampak
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  {risk.uraianDampak || "-"} (Pihak Terdampak: {risk.pihakTerdampak || "-"})
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.dampak}
                                </div>
                              </div>
                            )}

                            {/* 5. Pengendalian yang Ada & Sisa Risiko */}
                            {cp?.pengendalian?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Pengendalian yang Ada & Sisa Risiko
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  Pengendalian: {risk.pengendalianAda || "-"} | Penilaian: {risk.penilaianPengendalian || "-"} | Sisa: {risk.sisaRisiko || "-"}
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.pengendalian}
                                </div>
                              </div>
                            )}

                            {/* 6. Analisis Risiko */}
                            {cp?.analisis?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Analisis Risiko (K, D, Level)
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  K: {risk.levelKemungkinan || "-"}, D: {risk.levelDampak || "-"}, Skor: {risk.besaranRisiko || "-"}, Level: {risk.levelRisiko || "-"}
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.analisis}
                                </div>
                              </div>
                            )}

                            {/* 7. RTP */}
                            {cp?.rtp?.trim() && (
                              <div className="bg-pink-50/40 border border-pink-200 rounded-lg p-3.5">
                                <span className="inline-block bg-pink-100 text-pink-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kolom: Rencana Tindak Pengendalian (RTP)
                                </span>
                                <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 mb-2">
                                  <span className="font-semibold text-slate-500">Data Unit: </span>
                                  {risk.rtpList && risk.rtpList.length > 0 ? (
                                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                      {risk.rtpList.map((x: any, i: number) => (
                                        <li key={i}>{x.rencana} (PJ: {x.penanggungjawab || "-"}, Target: {x.targetWaktu || "-"})</li>
                                      ))}
                                    </ul>
                                  ) : "Belum ada RTP"}
                                </div>
                                <div className="text-xs text-pink-950 whitespace-pre-wrap font-medium">
                                  <strong className="text-pink-800 block mb-0.5">Catatan Auditor:</strong>
                                  {cp.rtp}
                                </div>
                              </div>
                            )}

                            {/* 8. Kesimpulan */}
                            {cp?.kesimpulan?.trim() && (
                              <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-3.5">
                                <span className="inline-block bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded mb-1.5">
                                  Kesimpulan & Arahan Tambahan
                                </span>
                                <div className="text-xs text-purple-950 whitespace-pre-wrap font-medium">
                                  {cp.kesimpulan}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Fallback Catatan Format Lama
                          <div className="bg-pink-50/70 border border-pink-200 p-4 rounded-lg">
                            <div className="text-xs text-pink-900 mb-1 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <span>Catatan Perbaikan:</span>
                            </div>
                            <div className="text-slate-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                              {risk.catatanAuditor}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <Link 
                            href="/dashboard/mr-identifikasi" 
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                          >
                            Perbaiki Risiko Ini di Menu Identifikasi Risiko &rarr;
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
