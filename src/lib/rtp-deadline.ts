/**
 * Utilitas Manajemen Target Waktu dan Pengecekan Batas Waktu (Deadline) RTP
 * Sesuai kebutuhan:
 * Pilihan Target Waktu:
 * - Bulan (pilihan Bulan dari Januari s.d. Desember)
 * - Rentang Bulan (pilihan Dari Bulan dan Sampai Bulan)
 * - Triwulan 1 (Januari - Maret)
 * - Triwulan 2 (April - Juni)
 * - Triwulan 3 (Juli - September)
 * - Triwulan 4 (Oktober - Desember)
 *
 * Pengecekan Batas Waktu:
 * - Jika progres belum 100% dan tanggal hari ini telah melewati batas akhir waktu target:
 *   -> "Melebihi Batas Waktu" (Peringatan / Alert)
 * - Jika progres belum 100% dan masih dalam batas waktu:
 *   -> "Dalam Masa Pelaksanaan"
 * - Jika progres telah mencapai 100%:
 *   -> "Selesai"
 */

export interface MonthOption {
  value: string;
  label: string;
  index: number; // 1 - 12
}

export const MONTH_OPTIONS: MonthOption[] = [
  { value: "Januari", label: "Januari", index: 1 },
  { value: "Februari", label: "Februari", index: 2 },
  { value: "Maret", label: "Maret", index: 3 },
  { value: "April", label: "April", index: 4 },
  { value: "Mei", label: "Mei", index: 5 },
  { value: "Juni", label: "Juni", index: 6 },
  { value: "Juli", label: "Juli", index: 7 },
  { value: "Agustus", label: "Agustus", index: 8 },
  { value: "September", label: "September", index: 9 },
  { value: "Oktober", label: "Oktober", index: 10 },
  { value: "November", label: "November", index: 11 },
  { value: "Desember", label: "Desember", index: 12 },
];

export const TARGET_TIPE_OPTIONS = [
  { value: "bulan", label: "Bulan" },
  { value: "rentang_bulan", label: "Rentang Bulan" },
  { value: "triwulan_1", label: "Triwulan 1 (Januari - Maret)" },
  { value: "triwulan_2", label: "Triwulan 2 (April - Juni)" },
  { value: "triwulan_3", label: "Triwulan 3 (Juli - September)" },
  { value: "triwulan_4", label: "Triwulan 4 (Oktober - Desember)" },
] as const;

export type TargetTipe = "bulan" | "rentang_bulan" | "triwulan_1" | "triwulan_2" | "triwulan_3" | "triwulan_4" | string;

export interface RTPItem {
  id?: string;
  rencana?: string;
  penanggungjawab?: string;
  targetWaktu?: string;
  targetTipe?: TargetTipe;
  targetBulan?: string;
  targetDariBulan?: string;
  targetSampaiBulan?: string;
  targetTahun?: string;
  bentukKomunikasi?: string;
  pemantauan?: {
    progres?: string;
    waktuPelaksanaan?: string;
    linkEviden?: string;
    persentase?: number;
    updatedAt?: string;
  };
}

/**
 * Mencari index bulan (1-12) berdasarkan nama bulan (case-insensitive)
 */
export function getMonthIndex(name?: string): number {
  if (!name) return 0;
  const clean = name.trim().toLowerCase();
  const found = MONTH_OPTIONS.find(
    (m) => m.value.toLowerCase() === clean || m.label.toLowerCase() === clean
  );
  if (found) return found.index;

  const abbrevs = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
  const idx = abbrevs.findIndex((a) => clean.startsWith(a));
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Mendapatkan nama bulan berdasarkan index (1-12)
 */
export function getMonthNameByIndex(index: number): string {
  const found = MONTH_OPTIONS.find((m) => m.index === index);
  return found ? found.value : "";
}

/**
 * Merakit string targetWaktu yang seragam dan mudah dibaca
 */
export function buildTargetWaktuString({
  tipe,
  bulan,
  dariBulan,
  sampaiBulan,
  tahun,
}: {
  tipe?: string;
  bulan?: string;
  dariBulan?: string;
  sampaiBulan?: string;
  tahun?: string;
}): string {
  const yr = (tahun || "").trim();
  const yrSuffix = yr ? ` ${yr}` : "";

  switch (tipe) {
    case "bulan":
      return bulan ? `Bulan ${bulan}${yrSuffix}` : (yr ? `Bulan${yrSuffix}` : "");
    case "rentang_bulan":
      if (dariBulan && sampaiBulan) {
        return `${dariBulan} s.d. ${sampaiBulan}${yrSuffix}`;
      } else if (dariBulan) {
        return `Mulai ${dariBulan}${yrSuffix}`;
      } else if (sampaiBulan) {
        return `Sampai ${sampaiBulan}${yrSuffix}`;
      }
      return `Rentang Bulan${yrSuffix}`;
    case "triwulan_1":
      return `Triwulan 1${yrSuffix}`;
    case "triwulan_2":
      return `Triwulan 2${yrSuffix}`;
    case "triwulan_3":
      return `Triwulan 3${yrSuffix}`;
    case "triwulan_4":
      return `Triwulan 4${yrSuffix}`;
    default:
      return "";
  }
}

/**
 * Melakukan parsing teks targetWaktu eksisting (misal data lama)
 * menjadi field terstruktur (tipe, bulan, rentang, tahun)
 */
export function parseTargetWaktuString(
  text?: string,
  fallbackYear?: string
): {
  tipe: TargetTipe;
  bulan: string;
  dariBulan: string;
  sampaiBulan: string;
  tahun: string;
} {
  const curYear = fallbackYear || new Date().getFullYear().toString();
  if (!text) {
    return {
      tipe: "bulan",
      bulan: "Januari",
      dariBulan: "Januari",
      sampaiBulan: "Desember",
      tahun: curYear,
    };
  }

  const clean = String(text).trim();
  const lower = clean.toLowerCase();
  const yearMatch = clean.match(/\b(20\d{2})\b/);
  const tahun = yearMatch ? yearMatch[1] : curYear;

  // Cek Triwulan
  if (lower.includes("triwulan 1") || lower.includes("tw 1") || lower.includes("tw1")) {
    return { tipe: "triwulan_1", bulan: "", dariBulan: "Januari", sampaiBulan: "Maret", tahun };
  }
  if (lower.includes("triwulan 2") || lower.includes("tw 2") || lower.includes("tw2")) {
    return { tipe: "triwulan_2", bulan: "", dariBulan: "April", sampaiBulan: "Juni", tahun };
  }
  if (lower.includes("triwulan 3") || lower.includes("tw 3") || lower.includes("tw3")) {
    return { tipe: "triwulan_3", bulan: "", dariBulan: "Juli", sampaiBulan: "September", tahun };
  }
  if (lower.includes("triwulan 4") || lower.includes("tw 4") || lower.includes("tw4")) {
    return { tipe: "triwulan_4", bulan: "", dariBulan: "Oktober", sampaiBulan: "Desember", tahun };
  }

  // Cek Rentang Bulan
  const isRange =
    lower.includes("s.d.") ||
    lower.includes("s/d") ||
    lower.includes("sampai") ||
    lower.includes(" - ") ||
    lower.includes("rentang");

  const matchedMonths: string[] = [];
  MONTH_OPTIONS.forEach((m) => {
    if (lower.includes(m.value.toLowerCase())) {
      matchedMonths.push(m.value);
    }
  });

  if (isRange && matchedMonths.length >= 2) {
    return {
      tipe: "rentang_bulan",
      bulan: "",
      dariBulan: matchedMonths[0],
      sampaiBulan: matchedMonths[matchedMonths.length - 1],
      tahun,
    };
  } else if (matchedMonths.length >= 1) {
    return {
      tipe: "bulan",
      bulan: matchedMonths[0],
      dariBulan: matchedMonths[0],
      sampaiBulan: matchedMonths[0],
      tahun,
    };
  }

  return {
    tipe: "bulan",
    bulan: "Januari",
    dariBulan: "Januari",
    sampaiBulan: "Desember",
    tahun,
  };
}

export interface RTPDeadlineInfo {
  status: "completed" | "overdue" | "ongoing";
  isOverdue: boolean;
  isCompleted: boolean;
  isOngoing: boolean;
  label: string;
  deadlineDate: Date | null;
  deadlineFormatted: string;
  daysDiff: number;
  daysDiffText: string;
  progressPercent: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Mengevaluasi status batas waktu (deadline) dari suatu RTP.
 * Memperhitungkan persentase penyelesaian, target tipe/waktu, dan tanggal sistem.
 */
export function getRtpDeadlineInfo(rtp?: RTPItem | null, fallbackYear?: string): RTPDeadlineInfo {
  const curYear = fallbackYear || new Date().getFullYear().toString();
  const progress = Number(rtp?.pemantauan?.persentase || 0);
  const isCompleted = progress === 100;

  // Jika tidak ada data target
  if (!rtp) {
    return {
      status: "ongoing",
      isOverdue: false,
      isCompleted: false,
      isOngoing: true,
      label: "Dalam Masa Pelaksanaan",
      deadlineDate: null,
      deadlineFormatted: "-",
      daysDiff: 0,
      daysDiffText: "",
      progressPercent: progress,
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      badgeBorder: "border-blue-200",
    };
  }

  // Tentukan parameter deadline
  let targetTipe = rtp.targetTipe;
  let targetBulan = rtp.targetBulan;
  let targetSampaiBulan = rtp.targetSampaiBulan;
  let targetTahun = rtp.targetTahun;

  // Jika tipe belum terdefinisi namun targetWaktu ada, coba parse
  if (!targetTipe && rtp.targetWaktu) {
    const parsed = parseTargetWaktuString(rtp.targetWaktu, fallbackYear);
    targetTipe = parsed.tipe;
    targetBulan = parsed.bulan;
    targetSampaiBulan = parsed.sampaiBulan;
    targetTahun = parsed.tahun;
  }

  const yearNum = parseInt(targetTahun || curYear, 10) || new Date().getFullYear();
  let endMonth = 12;

  switch (targetTipe) {
    case "bulan":
      endMonth = getMonthIndex(targetBulan) || 12;
      break;
    case "rentang_bulan":
      endMonth = getMonthIndex(targetSampaiBulan) || 12;
      break;
    case "triwulan_1":
      endMonth = 3;
      break;
    case "triwulan_2":
      endMonth = 6;
      break;
    case "triwulan_3":
      endMonth = 9;
      break;
    case "triwulan_4":
      endMonth = 12;
      break;
    default:
      endMonth = 12;
  }

  // Akhir hari dari bulan target pada jam 23:59:59.999
  // (new Date(yearNum, endMonth, 0) menghasilkan tanggal terakhir bulan endMonth)
  const deadlineDate = new Date(yearNum, endMonth, 0, 23, 59, 59, 999);
  
  // Format teks deadline: contoh "31 Maret 2026"
  const lastDay = deadlineDate.getDate();
  const monthName = getMonthNameByIndex(endMonth);
  const deadlineFormatted = `${lastDay} ${monthName} ${yearNum}`;

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

  if (isCompleted) {
    return {
      status: "completed",
      isOverdue: false,
      isCompleted: true,
      isOngoing: false,
      label: "Selesai (100%)",
      deadlineDate,
      deadlineFormatted,
      daysDiff: 0,
      daysDiffText: "Tuntas",
      progressPercent: progress,
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      badgeBorder: "border-emerald-200",
    };
  }

  // Jika progres belum 100% dan tanggal hari ini sudah melewati deadline
  if (now.getTime() > deadlineDate.getTime()) {
    return {
      status: "overdue",
      isOverdue: true,
      isCompleted: false,
      isOngoing: false,
      label: "Melebihi Batas Waktu",
      deadlineDate,
      deadlineFormatted,
      daysDiff: diffDays,
      daysDiffText: `Terlambat ${diffDays} hari`,
      progressPercent: progress,
      badgeBg: "bg-red-50",
      badgeText: "text-red-700",
      badgeBorder: "border-red-300",
    };
  }

  // Masih dalam batas waktu pelaksanaan
  return {
    status: "ongoing",
    isOverdue: false,
    isCompleted: false,
    isOngoing: true,
    label: "Dalam Masa Pelaksanaan",
    deadlineDate,
    deadlineFormatted,
    daysDiff: diffDays,
    daysDiffText: `Sisa ${diffDays} hari`,
    progressPercent: progress,
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
  };
}
