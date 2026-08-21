import type { Metadata } from "next";
import { Archivo_Black, Instrument_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

// Store/wall UI fonts (v5 grammar): Archivo Black = display titles, Instrument Sans = body,
// Space Mono = all data. Exposed as CSS vars and applied EXPLICITLY in wall components — the
// global body font is left untouched so /music stays plain server-rendered DOM.
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});
const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "chunkylabs",
  description: "An interactive record store visit.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${instrumentSans.variable} ${spaceMono.variable}`}
    >
      <body>
        {/* Lenis smooth-scroll wraps everything; server-rendered children pass through
            unchanged, so the /music escape hatch stays plain, server-rendered DOM. */}
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
