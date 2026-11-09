import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const font = Inter({ subsets: ["latin"] });

import { ThemeProvider } from "@/context/ThemeContext";

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
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem('sim_risiko_theme_color');
                localStorage.removeItem('sim_risiko_theme_bgtone');
                localStorage.removeItem('sim_risiko_theme_navbar');
                localStorage.removeItem('sim_risiko_theme_fontsize');
                localStorage.removeItem('sim_risiko_menu_position');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={font.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
