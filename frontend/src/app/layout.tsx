import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Hệ thống Ký duyệt Nội bộ",
  description: "Phần mềm trình duyệt, luân chuyển văn bản",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} font-sans antialiased bg-slate-50`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
