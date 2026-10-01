import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YCM One — Yojana Connect Mitra",
  description: "One connected digital platform for family, government services, documents, education, jobs, business, finance, legal and citizen assistance.",
  applicationName: "YCM One",
  keywords: ["YCM One","Yojana Connect Mitra","Family 360","government services","digital assistance","citizen services"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}