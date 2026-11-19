"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Clock, Calendar } from "lucide-react";
import { getRtpDeadlineInfo, RTPItem } from "@/lib/rtp-deadline";
import { cn } from "cn";

interface RtpStatusBadgeProps {
  rtp?: RTPItem | null;
  fallbackYear?: string;
  className?: string;
  showDaysText?: boolean;
  compact?: boolean;
}

export function RtpStatusBadge({
  rtp,
  fallbackYear,
  className,
  showDaysText = false,
  compact = false,
}: RtpStatusBadgeProps) {
  const info = getRtpDeadlineInfo(rtp, fallbackYear);

  if (info.isCompleted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full border transition-all",
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          "bg-emerald-50 text-emerald-700 border-emerald-200",
          className
        )}
        title={`Status: Selesai (100%) - Target: ${info.deadlineFormatted}`}
      >
        <CheckCircle2 className={compact ? "w-3 h-3 text-emerald-600" : "w-3.5 h-3.5 text-emerald-600"} />
        <span>Selesai (100%)</span>
      </span>
    );
  }

  if (info.isOverdue) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-bold rounded-full border transition-all shadow-sm",
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          "bg-red-50 text-red-700 border-red-300 ring-1 ring-red-300/50",
          className
        )}
        title={`Peringatan: Melebihi batas waktu ${info.deadlineFormatted} (${info.daysDiffText})`}
      >
        <AlertTriangle className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5", "text-red-600 shrink-0 animate-bounce")} />
        <span>Melebihi Batas Waktu</span>
        {showDaysText && info.daysDiffText && (
          <span className="text-[10px] font-normal opacity-90 hidden sm:inline">
            ({info.daysDiffText})
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-all",
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        "bg-blue-50 text-blue-700 border-blue-200",
        className
      )}
      title={`Batas Waktu: ${info.deadlineFormatted} (${info.daysDiffText})`}
    >
      <Clock className={compact ? "w-3 h-3 text-blue-600" : "w-3.5 h-3.5 text-blue-600"} />
      <span>Dalam Masa Pelaksanaan</span>
      {showDaysText && info.daysDiffText && (
        <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
          ({info.daysDiffText})
        </span>
      )}
    </span>
  );
}

interface RtpDeadlineAlertProps {
  rtp?: RTPItem | null;
  fallbackYear?: string;
  className?: string;
}

/**
 * Alert Banner yang mencolok ketika RTP melebihi batas waktu (overdue)
 */
export function RtpDeadlineAlert({ rtp, fallbackYear, className }: RtpDeadlineAlertProps) {
  const info = getRtpDeadlineInfo(rtp, fallbackYear);

  if (!info.isOverdue) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-xl bg-red-50/90 border border-red-200 text-red-900 shadow-sm animate-in fade-in duration-200",
        className
      )}
    >
      <div className="p-1.5 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
            Peringatan: RTP Melebihi Batas Waktu Pelaksanaan!
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-200/80 text-red-800">
            {info.daysDiffText}
          </span>
        </div>
        <p className="text-xs text-red-700 mt-1 leading-relaxed">
          Target waktu pelaksanaan RTP ini (<strong>{rtp?.targetWaktu || info.deadlineFormatted}</strong>) telah
          berakhir pada tanggal <strong>{info.deadlineFormatted}</strong>, namun realisasi progres saat ini baru mencapai{" "}
          <strong>{info.progressPercent}%</strong>. Mohon segera lakukan percepatan mitigasi atau perbarui laporan pemantauan.
        </p>
      </div>
    </div>
  );
}
