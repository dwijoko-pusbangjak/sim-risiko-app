"use client";

import React from "react";
import { MASCOT_IMAGE_BASE64 } from "@/lib/mascot-data";

interface AnimatedMascotProps {
  isSpeaking: boolean;
  className?: string;
  onMascotClick?: () => void;
}

export const AnimatedMascot: React.FC<AnimatedMascotProps> = ({
  isSpeaking,
  className = "w-32 lg:w-40",
  onMascotClick,
}) => {
  return (
    <div
      onClick={onMascotClick}
      className={`relative shrink-0 select-none cursor-pointer group transition-transform duration-500 ease-out ${
        isSpeaking ? "scale-[1.03] -rotate-1" : "scale-100 rotate-0"
      } ${className}`}
      title={isSpeaking ? "Maskot Si-MaRi sedang berbicara dan menunjuk kalimat..." : "Maskot Si-MaRi Kemendes PDT"}
    >
      {/* 1. Efek Cahaya Aura Lembut di Belakang Maskot */}
      <div
        className={`absolute inset-0 m-auto w-3/4 h-3/4 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? "bg-blue-500/30 scale-125 animate-pulse"
            : "bg-blue-400/15 scale-100"
        }`}
      />

      {/* 2. Gambar Karakter Dasar Maskot (329 x 377) */}
      <div className="relative w-full aspect-[329/377]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MASCOT_IMAGE_BASE64}
          alt="Maskot Si-MaRi Kemendes PDT"
          className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(28,57,142,0.22)] select-none pointer-events-none"
        />

        {/* =================================================================== */}
        {/* 3. LAYER ANIMASI MULUT BERBICARA (Lip-Sync Mouth Animation)         */}
        {/* =================================================================== */}
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: "47.2%",
            left: "41.2%",
            width: "24.5%",
            height: "14.5%",
          }}
        >
          {isSpeaking ? (
            /* Saat Berbicara: Mulut bergerak membuka & menutup secara dinamis */
            <div className="w-full h-full relative flex items-center justify-center animate-mouth-talk origin-center">
              <svg
                viewBox="0 0 80 48"
                className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Rongga Dalam Mulut */}
                  <linearGradient id="mouthCavity" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0c192c" />
                    <stop offset="100%" stopColor="#1a0b1e" />
                  </linearGradient>
                  {/* Lidah Berwarna Coral Cerah */}
                  <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ff7b89" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>

                {/* Rongga Mulut Terbuka Berbicara */}
                <path
                  d="
                    M 6,10
                    C 24,17 56,17 74,10
                    C 75,22 66,42 40,43
                    C 14,42 5,22 6,10 Z
                  "
                  fill="url(#mouthCavity)"
                  stroke="#0c192c"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />

                {/* Gigi Putih Atas yang Rapi */}
                <path
                  d="
                    M 10,12
                    C 26,17 54,17 70,12
                    C 66,21 54,23 40,23
                    C 26,23 14,21 10,12 Z
                  "
                  fill="#ffffff"
                  stroke="#0c192c"
                  strokeWidth="1.2"
                />

                {/* Lidah Bergoyang Dinamis saat Berbicara */}
                <path
                  className="animate-tongue-bounce origin-bottom"
                  d="
                    M 22,34
                    C 26,24 54,24 58,34
                    C 52,43 28,43 22,34 Z
                  "
                  fill="url(#tongueGrad)"
                  stroke="#9f1239"
                  strokeWidth="1.2"
                />

                {/* Garis Bibir Atas dengan Sudut Senyum */}
                <path
                  d="M 4,11 C 7,6 10,11 14,13"
                  stroke="#0c192c"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 76,11 C 73,6 70,11 66,13"
                  stroke="#0c192c"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Partikel Gelombang Suara Ringan Keluar dari Mulut */}
              <div className="absolute -top-1 -right-2 flex items-center gap-0.5 opacity-80 animate-sound-wave">
                <span className="w-1 h-2 bg-blue-500 rounded-full" />
                <span className="w-1 h-3.5 bg-sky-400 rounded-full" />
                <span className="w-1 h-2 bg-indigo-500 rounded-full" />
              </div>
            </div>
          ) : (
            /* Saat Tidak Berbicara (Tenggelam): Mulut tersenyum ramah dan tertutup rapi */
            <div className="w-full h-full relative flex items-center justify-center">
              <svg
                viewBox="0 0 80 48"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradien Warna Biru Wajah Pelindung (Shield) */}
                  <linearGradient id="shieldSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e9bf0" />
                    <stop offset="100%" stopColor="#106fc7" />
                  </linearGradient>
                </defs>

                {/* Patch Menutup Rongga Mulut Asli */}
                <path
                  d="
                    M 4,8
                    C 24,14 56,14 76,8
                    C 74,28 64,45 40,46
                    C 16,45 6,28 4,8 Z
                  "
                  fill="url(#shieldSkin)"
                />

                {/* Garis Senyum Tertutup Manis (Closed Smile) */}
                <path
                  d="
                    M 10,18
                    C 26,34 54,34 70,18
                  "
                  stroke="#0c192c"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Lesung Pipi Kiri & Kanan */}
                <path
                  d="M 8,16 C 9,13 13,16 14,19"
                  stroke="#0c192c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 72,16 C 71,13 67,16 66,19"
                  stroke="#0c192c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Bibir Bawah Lembut */}
                <path
                  d="M 33,33 C 37,35 43,35 47,33"
                  stroke="#084d8f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 4. LAYER ANIMASI TANGAN MENUNJUK KE TULISAN                          */}
        {/* =================================================================== */}
        <div
          className={`absolute pointer-events-none transition-all duration-500 ease-out ${
            isSpeaking
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-3"
          }`}
          style={{
            top: "27%",
            left: "8%",
            width: "31%",
            height: "36%",
          }}
        >
          {/* Sarung Tangan Putih dengan Jari Telunjuk Menunjuk ke Balon Tulisan */}
          <div className="w-full h-full relative animate-point-gesture origin-bottom-right">
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full drop-shadow-[0_10px_16px_rgba(15,23,42,0.35)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="blueSleeve" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e9bf0" />
                  <stop offset="100%" stopColor="#0d65b9" />
                </linearGradient>
                <linearGradient id="gloveShading" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
              </defs>

              {/* Lengan Baju Biru */}
              <path
                d="M 72,98 C 68,115 50,118 36,114 C 42,102 52,90 60,82 Z"
                fill="url(#blueSleeve)"
                stroke="#0c192c"
                strokeWidth="3.6"
                strokeLinejoin="round"
              />

              {/* Manset Pergelangan Sarung Tangan Putih */}
              <ellipse
                cx="64"
                cy="85"
                rx="19"
                ry="9.5"
                transform="rotate(-30 64 85)"
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.6"
              />
              <ellipse
                cx="64"
                cy="85"
                rx="15"
                ry="6.5"
                transform="rotate(-30 64 85)"
                fill="#cbd5e1"
                opacity="0.4"
              />

              {/* Badan Telapak Sarung Tangan */}
              <path
                d="
                  M 55,78
                  C 44,75 34,68 28,58
                  C 23,48 26,38 32,32
                  C 30,22 24,12 16,5
                  C 10,0 3,8 7,18
                  C 12,26 18,34 22,40
                  C 16,42 12,47 12,53
                  C 12,59 17,64 23,67
                  C 19,71 20,78 27,83
                  C 36,89 48,86 55,78 Z
                "
                fill="url(#gloveShading)"
                stroke="#0c192c"
                strokeWidth="3.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Bayangan Lipatan Sarung Tangan */}
              <path
                d="
                  M 52,77
                  C 42,75 34,68 28,60
                  C 26,55 26,50 28,45
                  C 24,47 20,52 20,58
                  C 20,64 25,70 32,74
                  C 40,78 48,78 52,77 Z
                "
                fill="#94a3b8"
                opacity="0.3"
              />

              {/* JARI TELUNJUK UTAMA: Menunjuk ke Atas-Kiri (Arah Balon Teks) */}
              <path
                d="
                  M 34,35
                  C 28,26 22,16 17,8
                  C 12,1 3,7 7,16
                  C 12,25 18,35 24,42 Z
                "
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Garis Kilap dan Sendi Jari Telunjuk */}
              <path
                d="M 12,12 C 16,18 21,26 25,34"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 17,25 C 19,26 22,25 24,23"
                stroke="#0c192c"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Ibu Jari Menekuk di Depan */}
              <path
                d="
                  M 36,52
                  C 39,42 48,38 54,43
                  C 58,47 56,55 50,60
                  C 45,63 39,62 36,52 Z
                "
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
              <path
                d="M 43,45 C 46,47 48,51 47,55"
                stroke="#0c192c"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Lipatan 3 Jari Bawah yang Menekuk */}
              <path
                d="M 23,45 C 17,47 15,53 17,58 C 19,62 25,63 29,59"
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <path
                d="M 19,59 C 15,62 15,68 18,72 C 21,75 27,75 31,69"
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <path
                d="M 21,73 C 19,76 19,81 23,84 C 27,87 33,85 37,79"
                fill="#ffffff"
                stroke="#0c192c"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
            </svg>

            {/* Bintang Kilau Aksen di Ujung Jari Telunjuk */}
            <div className="absolute -top-3 -left-3 flex items-center justify-center animate-spin-slow">
              <span className="text-amber-400 text-sm font-black drop-shadow-[0_2px_4px_rgba(245,158,11,0.6)]">
                ✦
              </span>
            </div>
            <div className="absolute -top-1 left-2 animate-ping opacity-75">
              <span className="w-2 h-2 rounded-full bg-amber-400 block" />
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 5. INDIKATOR JALUR VISUAL: Garis Sorot Menuju Balon Tulisan         */}
        {/* =================================================================== */}
        {isSpeaking && (
          <div className="absolute -top-6 -left-8 w-20 h-16 pointer-events-none z-20">
            <svg viewBox="0 0 80 60" className="w-full h-full overflow-visible">
              {/* Garis Gelombang Aksen yang Menunjuk ke Arah Teks */}
              <path
                d="M 50,48 C 35,32 25,25 5,12"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
                fill="none"
                className="animate-pulse"
              />
              {/* Panah Menuju Balon Teks */}
              <polygon
                points="4,7 5,17 14,13"
                fill="#38bdf8"
                className="animate-bounce"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
