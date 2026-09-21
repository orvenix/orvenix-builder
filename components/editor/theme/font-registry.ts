/**
 * V2-1: pure font-name -> CSS-variable-reference mapping.
 *
 * Deliberately contains NO import of next/font/google (that lives in the
 * sibling font-catalog.ts, loaded only from app/layout.tsx). This file is
 * imported directly by the Heading/Text primitives, which are reachable
 * from several existing test suites via app/actions/ai.ts's import graph
 * (confirmed: tests/unit/site-creation-action.test.ts imports the real
 * app/actions/ai module). next/font/google's exports are not callable
 * outside Next's build-time compiler transform -- importing it from any
 * file reachable by the plain-Node test runner throws
 * "(0, google_1.Inter) is not a function". Keeping this mapping
 * dependency-free avoids that entirely, regardless of which app code path
 * ends up importing Heading/Text.
 */

const FONT_NAME_TO_CSS_VAR: Record<string, string> = {
  "Inter": "var(--font-inter)",
  "Playfair Display": "var(--font-playfair-display)",
  "Oswald": "var(--font-oswald)",
  "JetBrains Mono": "var(--font-jetbrains-mono)",
}

/**
 * Resolves a theme font-family name (eg. "Playfair Display") to the
 * self-hosted font actually loaded by font-catalog.ts's FONT_VARIABLE_CLASSES
 * (applied once in app/layout.tsx), when it's one of the four allowlisted
 * names. Any other value (a legacy/custom font name, or undefined) passes
 * through unchanged -- callers already handle a plain string or undefined
 * the way they always have.
 */
export function resolveFontCssValue(fontName: string | undefined): string | undefined {
  if (!fontName) return fontName
  return FONT_NAME_TO_CSS_VAR[fontName] ?? fontName
}
