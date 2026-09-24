import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const font = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "..:: Sistem Informasi Manajemen Risiko - Kemendesa PDT ::..",
  description: "Sistem Informasi Manajemen Risiko Kementerian Desa dan Pembangunan Daerah Tertinggal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={font.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
