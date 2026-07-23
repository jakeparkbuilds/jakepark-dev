import type { Metadata } from "next";
import { bricolage, plexMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jake Park",
  description: "Jake Park — machine learning and data systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${plexMono.variable}`}>
      <body className="bg-paper font-display antialiased">{children}</body>
    </html>
  );
}
