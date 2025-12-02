import "@/styles/globals.css";

import { type Metadata } from "next";
import { Nunito_Sans } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "SI-KAP",
  description:
    "Sistem Informasi Kinerja & Akademik Prakerin (SI-KAP) adalah platform yang dirancang untuk membantu perusahaan dalam mengelola kinerja para siswa PKL atau prakerin.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunitoSans.variable}`}>
      <body className="font-sans">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
