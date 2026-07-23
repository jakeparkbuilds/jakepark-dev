import localFont from "next/font/local";

export const bricolage = localFont({
  src: "./fonts/bricolage-grotesque-variable.woff2",
  variable: "--font-bricolage",
  weight: "400 500",
  display: "swap",
});

export const plexMono = localFont({
  src: [
    {
      path: "./fonts/ibm-plex-mono-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ibm-plex-mono-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});
