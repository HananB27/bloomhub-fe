import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/hr-dashboard/ui/sonner";

const fonts = {
  geistSans: Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  }),
  geistMono: Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  }),
};

export const metadata: Metadata = {
  title: "BloomHub",
  description: "Human Resources Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fonts.geistSans.variable} ${fonts.geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster richColors theme="light" />
        </Providers>
      </body>
    </html>
  );
}
