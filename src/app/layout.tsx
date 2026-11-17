import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/ThemeContext";

const font = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

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
