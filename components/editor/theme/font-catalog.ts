/**
 * V2-1: real font delivery for the theme.fontHeading/fontBody tokens.
 *
 * Statically imports exactly the four font names applyThemeDirection
 * (lib/orvenix-ai/autonomous/site-builder.ts) already assigns to generated
 * themes ("Inter", "Playfair Display", "Oswald", "JetBrains Mono"), via
 * next/font/google (self-hosted at build time, zero runtime request to
 * Google's font CDN).
 *
 * IMPORTANT: this file must be imported ONLY from app/layout.tsx (applying
 * FONT_VARIABLE_CLASSES once, high in the tree). next/font/google relies on
 * Next.js's build-time compiler transform and is not callable outside it --
 * importing it from anywhere reachable by the plain-Node unit test suite
 * throws. The Heading/Text primitives deliberately do NOT import this file;
 * see the dependency-free font-registry.ts for the name-resolution logic
 * they actually use.
 */
import { Inter, Playfair_Display, Oswald, JetBrains_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
})

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

/** Applied once on <body> in app/layout.tsx. */
export const FONT_VARIABLE_CLASSES = [
  inter.variable,
  playfairDisplay.variable,
  oswald.variable,
  jetBrainsMono.variable,
].join(" ")
