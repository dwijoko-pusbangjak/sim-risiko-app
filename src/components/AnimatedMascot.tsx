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
      {/* 1. Efek Cahaya Pendar Biru Halus di Belakang Maskot */}
      <div
        className={`absolute inset-0 m-auto w-3/4 h-3/4 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? "bg-blue-500/25 scale-125 animate-pulse"
            : "bg-blue-400/15 scale-100"
        }`}
      />

      {/* 2. Karakter Maskot Si-MaRi Otentik (Menggunakan Tangan & Mulut Asli Maskot) */}
      <div className="relative w-full aspect-[329/377] drop-shadow-[0_12px_24px_rgba(28,57,142,0.2)]">
        <svg
          viewBox="0 0 329 377"
          className="w-full h-full select-none pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Clip path untuk Mulut Asli Maskot (X: 121..197, Y: 154..189) */}
            <clipPath id="mascotOwnMouthClip">
              <path d="
                M 121,154
                C 135,151 183,151 197,154
                C 197,172 181,189 158,189
                C 135,189 121,172 121,154 Z
              " />
            </clipPath>

            {/* Clip path untuk Rongga Mulut (Agar saat menutup terlihat senyum alami) */}
            <clipPath id="mascotMouthInnerClip">
              <path d="
                M 124,156
                C 136,154 180,154 194,156
                C 194,170 178,186 158,186
                C 138,186 124,170 124,156 Z
              " />
            </clipPath>

            {/* Clip path untuk Tangan & Lengan Asli Maskot (X: 16..95, Y: 134..232) */}
            <clipPath id="mascotOwnArmClip">
              <path d="
                M 66,134
                C 74,134 78,144 76,155
                C 82,156 94,166 94,185
                C 94,202 85,214 74,218
                C 72,225 60,232 38,230
                C 22,224 16,206 20,192
                C 24,176 34,168 46,164
                C 52,150 56,135 66,134 Z
              " />
            </clipPath>
          </defs>

          {/* LAYER 1: Gambar Maskot Utuh Asli */}
          <image
            href={MASCOT_IMAGE_BASE64}
            width={329}
            height={377}
          />

          {/* LAYER 2: Patch Biru Wajah Pelindung (Hanya aktif saat berbicara agar mulut membuka & menutup sempurna tanpa bayangan ganda) */}
          {isSpeaking && (
            <g clipPath="url(#mascotMouthInnerClip)">
              <rect x="120" y="150" width="38" height="40" fill="#1e9bf0" />
              <rect x="158" y="150" width="42" height="40" fill="#106fc7" />
            </g>
          )}

          {/* LAYER 3: Mulut Asli Maskot yang Berbicara (Lip-Sync dengan Mulut Sendiri) */}
          <g
            className={isSpeaking ? "animate-own-mouth-talk" : ""}
            style={{ transformOrigin: "158px 156px" }}
          >
            <image
              href={MASCOT_IMAGE_BASE64}
              width={329}
              height={377}
              clipPath="url(#mascotOwnMouthClip)"
            />
          </g>

          {/* LAYER 4: Tangan Asli Maskot yang Menunjuk (Menggerakkan Jempol & Lengan Aslinya) */}
          <g
            className={isSpeaking ? "animate-own-arm-point" : ""}
            style={{ transformOrigin: "30px 220px" }}
          >
            <image
              href={MASCOT_IMAGE_BASE64}
              width={329}
              height={377}
              clipPath="url(#mascotOwnArmClip)"
            />

            {/* Aksen Kilauan Bintang pada Ujung Jempol Penunjuk Asli saat Berbicara */}
            {isSpeaking && (
              <g className="animate-star-beacon">
                <text
                  x="63"
                  y="132"
                  fontSize="17"
                  fill="#f59e0b"
                  fontWeight="900"
                  style={{ textShadow: "0 2px 6px rgba(245, 158, 11, 0.7)" }}
                >
                  ✦
                </text>
              </g>
            )}
          </g>

          {/* Gelombang Suara Halus di Dekat Mulut saat Berbicara */}
          {isSpeaking && (
            <g className="animate-sound-wave" opacity="0.8">
              <circle cx="198" cy="168" r="2.5" fill="#38bdf8" />
              <circle cx="204" cy="166" r="3.2" fill="#0284c7" />
              <circle cx="211" cy="164" r="2.2" fill="#6366f1" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
