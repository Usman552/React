import { Bricolage_Grotesque, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

// Self-hosted by Next.js at build time: no third-party request, no layout shift.
// Each font is exposed as a CSS variable used by index.css and admin.css.

export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-family-display",
  display: "swap",
});

export const body = Inter({
  subsets: ["latin"],
  variable: "--font-family-body",
  display: "swap",
});

// Editorial italic for highlighted words in headings.
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-family-serif",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-family-mono",
  display: "swap",
});

export const fontVariables = [display.variable, body.variable, serif.variable, mono.variable].join(" ");
