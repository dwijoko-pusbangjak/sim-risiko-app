"use client";

import React from "react";
import {
  useTheme,
  COLOR_OPTIONS,
  BG_TONE_OPTIONS,
  ColorTheme,
  BgTone,
  NavbarStyle,
  FontSize,
} from "@/context/ThemeContext";
import {
  Palette,
  Check,
  RotateCcw,
  X,
  Eye,
  Sparkles,
  Type,
  LayoutTemplate,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function ThemeCustomizerModal() {
  const {
    colorTheme,
    bgTone,
    navbarStyle,
    fontSize,
    isCustomizerOpen,
    setColorTheme,
    setBgTone,
    setNavbarStyle,
    setFontSize,
    closeCustomizer,
    resetToDefault,
  } = useTheme();

  if (!isCustomizerOpen) return null;

  const handleApplyAndClose = () => {
    toast.success("Pengaturan warna tampilan berhasil diterapkan!");
    closeCustomizer();
  };

  const handleReset = () => {
    resetToDefault();
    toast.info("Pengaturan warna dikembalikan ke default (Hijau Zamrud).");
  };

  const activeColorObj = COLOR_OPTIONS.find((c) => c.id === colorTheme) || COLOR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                Sesuaikan Warna & Kenyamanan Tampilan
              </h2>
              <p className="text-xs text-slate-500">
                Pilih palet warna dan nuansa layar yang paling nyaman bagi mata Anda saat bekerja.
              </p>
            </div>
          </div>
          <button
            onClick={closeCustomizer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* Kotak Pratinjau Interaktif Langsung (Live Preview) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Pratinjau Langsung Tema ({activeColorObj.name})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Warna Aktif: {activeColorObj.name}
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 pr-2 border-r border-slate-200">
                <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <span>Si<span className="text-emerald-600">-MaRi</span></span>
              </div>

              <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium shadow-xs hover:opacity-90 transition-opacity">
                Tombol Utama
              </button>

              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Badge Aktif
              </span>

              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Indikator Sukses</span>
              </div>
            </div>
          </div>

          {/* Bagian 1: Pilihan Skema Warna Aksen */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                1. Pilihan Warna Aksen Utama (8 Pilihan Nyaman)
              </label>
              <span className="text-[11px] text-slate-400">Pilih salah satu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COLOR_OPTIONS.map((opt) => {
                const isSelected = colorTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColorTheme(opt.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-xs mt-0.5"
                      style={{ backgroundColor: opt.primaryHex }}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/70" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{opt.name}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-emerald-200 text-emerald-900" : "bg-slate-100 text-slate-600"
                        }`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {opt.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian 2: Nuansa Latar Belakang (Eye Comfort Tones) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                2. Nuansa Kenyamanan Latar Belakang (Eye-Care)
              </label>
              <span className="text-[11px] text-slate-400">Mengurangi ketegangan mata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BG_TONE_OPTIONS.map((bg) => {
                const isSelected = bgTone === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBgTone(bg.id)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800">{bg.name}</span>
                      <div className={`w-4 h-4 rounded-full border ${bg.colorPreview} shadow-2xs flex items-center justify-center`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {bg.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian 3: Gaya Bilah Navigasi Menu Atas */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-emerald-600" />
                3. Gaya Bilah Menu Navigasi Atas
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setNavbarStyle("dark")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  navbarStyle === "dark"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Gelap Elegan (Default)</span>
                  {navbarStyle === "dark" && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Bilah menu atas gelap pekat dengan submenu transparan frosted glass.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNavbarStyle("tinted")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  navbarStyle === "tinted"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Selaras Warna Aksen</span>
                  {navbarStyle === "tinted" && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Bilah menu atas bernuansa senada dengan warna tema aksen yang Anda pilih.
                </p>
              </button>
            </div>
          </div>

          {/* Bagian 4: Skala Keterbacaan Huruf (Font Size) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-emerald-600" />
                4. Skala Keterbacaan Huruf
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  fontSize === "normal"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Standar (100%)</span>
                  {fontSize === "normal" && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Ukuran proporsional default aplikasi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  fontSize === "large"
                    ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Nyaman Lebih Besar (+6%)</span>
                  {fontSize === "large" && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Teks sedikit lebih besar untuk memudahkan membaca angka dan tabel data panjang.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan ke Default</span>
          </button>

          <button
            type="button"
            onClick={handleApplyAndClose}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:opacity-90 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan & Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
