import type { Metadata } from "next";
import PlotterCursor from "./components/cursor/PlotterCursor";
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
      <body className="bg-paper font-display antialiased">
        {children}
        {/* No grain layer exists yet in this codebase to mount "after" —
            this is the last child of body, so it sits topmost in normal
            stacking order even before its explicit z-index. */}
        <PlotterCursor />
      </body>
    </html>
  );
}
