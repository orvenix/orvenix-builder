import type { GlobalTheme, SEOMetadata } from "../../../types/editor"

export const DEFAULT_DOCUMENT_THEME: GlobalTheme = {
  colors: {
    primary: "#111827",
    secondary: "#4f46e5",
    background: "#ffffff",
    text: "#1f2937",
    accent: "#06b6d4",
  },
  fontHeading: "Inter, sans-serif",
  fontBody: "Inter, sans-serif",
  spacing: {
    sectionX: "1.5rem",
    sectionY: "3rem",
    stack: "1.5rem",
  },
  radius: {
    card: "1rem",
    button: "999px",
  },
  shadow: {
    soft: "0 12px 32px rgba(15,23,42,0.08)",
    strong: "0 24px 60px rgba(15,23,42,0.18)",
  },
  motion: {
    duration: "240ms",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
}

export const DEFAULT_DOCUMENT_SEO: SEOMetadata = {
  title: "Mi Sitio Web Orvenix",
  description: "Un sitio web creado con Orvenix.",
  keywords: "",
  ogImage: "",
}

export function normalizeDocumentSeo(seo?: SEOMetadata) {
  return {
    title: seo?.title?.trim() || DEFAULT_DOCUMENT_SEO.title,
    description: seo?.description?.trim() || DEFAULT_DOCUMENT_SEO.description,
    keywords: seo?.keywords?.trim() || DEFAULT_DOCUMENT_SEO.keywords,
    ogImage: seo?.ogImage?.trim() || DEFAULT_DOCUMENT_SEO.ogImage,
  }
}

export function tokenToSpacing(token: unknown) {
  switch (token) {
    case "none":
      return "0"
    case "sm":
      return "0.75rem"
    case "md":
      return "1.5rem"
    case "lg":
      return "3rem"
    case "xl":
      return "5rem"
    default:
      return null
  }
}

export function tokenToMaxWidth(token: unknown) {
  switch (token) {
    case "sm":
      return "42rem"
    case "md":
      return "56rem"
    case "lg":
      return "72rem"
    case "xl":
      return "80rem"
    case "full":
      return "100%"
    default:
      return null
  }
}

export function tokenToFontSize(token: unknown, type: string) {
  const map: Record<string, string> = {
    sm: "0.95rem",
    md: type === "text" ? "1rem" : "1.25rem",
    lg: type === "text" ? "1.125rem" : "1.5rem",
    xl: "2rem",
    "2xl": "2.5rem",
    "3xl": "3rem",
    "4xl": "3.75rem",
    "5xl": "4.5rem",
  }

  return typeof token === "string" ? map[token] ?? null : null
}

export function tokenToFontWeight(token: unknown) {
  switch (token) {
    case "normal":
      return "400"
    case "medium":
      return "500"
    case "semibold":
      return "600"
    case "bold":
      return "700"
    case "extrabold":
      return "800"
    default:
      return null
  }
}

export function tokenToRadius(token: unknown) {
  switch (token) {
    case "none":
      return "0"
    case "sm":
      return "0.5rem"
    case "md":
      return "0.85rem"
    case "lg":
      return "1.25rem"
    case "xl":
      return "1.75rem"
    default:
      return null
  }
}

export function tokenToShadow(token: unknown) {
  switch (token) {
    case "sm":
      return "0 8px 20px rgba(15, 23, 42, 0.08)"
    case "md":
      return "0 16px 40px rgba(15, 23, 42, 0.12)"
    case "lg":
      return "0 28px 60px rgba(15, 23, 42, 0.16)"
    case "xl":
      return "0 36px 80px rgba(15, 23, 42, 0.2)"
    default:
      return null
  }
}

export function normalizePublishedUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return ""
  if (
    raw.startsWith("/") ||
    raw.startsWith("#") ||
    raw.startsWith("data:") ||
    raw.startsWith("mailto:") ||
    raw.startsWith("tel:") ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)
  ) {
    return raw
  }

  return `/${raw.replace(/^\.?\//, "")}`
}
