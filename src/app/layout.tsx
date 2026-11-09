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
                var t = localStorage.getItem('sim_risiko_theme_color');
                if (t) document.documentElement.setAttribute('data-theme', t);
                var b = localStorage.getItem('sim_risiko_theme_bgtone');
                if (b) document.documentElement.setAttribute('data-bg-tone', b);
                var n = localStorage.getItem('sim_risiko_theme_navbar');
                if (n) document.documentElement.setAttribute('data-navbar-style', n);
                var f = localStorage.getItem('sim_risiko_theme_fontsize');
                if (f) document.documentElement.setAttribute('data-font-size', f);
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
