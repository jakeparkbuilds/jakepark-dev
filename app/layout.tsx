import type { Metadata } from "next";
import PlotterCursor from "./components/cursor/PlotterCursor";
import { bricolage, plexMono } from "./fonts";
import "./globals.css";

const DESCRIPTION =
  "CS + Math at Georgetown. Building ML and data systems for civic and social impact.";

export const metadata: Metadata = {
  // Required, not optional: without it Next emits the og:image as a relative
  // path, and iMessage / Slack / Twitter all resolve that against nothing and
  // render a card with no image. Every absolute URL in the tags below is
  // derived from this.
  metadataBase: new URL("https://jakekpark.com"),
  title: "Jake Park",
  description: DESCRIPTION,
  openGraph: {
    title: "Jake Park",
    description: DESCRIPTION,
    url: "https://jakekpark.com",
    siteName: "Jake Park",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jake Park",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The pre-paint script below adds the `intro` class to <html> before
      // hydration on a first visit, which the server did not render — expected,
      // and the reason for suppressHydrationWarning (the theme-script pattern).
      suppressHydrationWarning
      className={`${bricolage.variable} ${plexMono.variable}`}
    >
      <body className="bg-paper font-display antialiased">
        {/* Pre-paint gate for the hero loader (§ 01). Runs before the body
            paints, so adding `intro` never flashes the final hero first. Only
            the first visit of a session animates, and never under reduced
            motion; the flag is set here (not at completion) so a reload mid-
            intro still skips it. See HeroIntro + globals.css html.intro. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem('heroIntroSeen'))return;sessionStorage.setItem('heroIntroSeen','1');document.documentElement.classList.add('intro');}catch(e){}})();",
          }}
        />
        {children}
        {/* No grain layer exists yet in this codebase to mount "after" —
            this is the last child of body, so it sits topmost in normal
            stacking order even before its explicit z-index. */}
        <PlotterCursor />
      </body>
    </html>
  );
}
