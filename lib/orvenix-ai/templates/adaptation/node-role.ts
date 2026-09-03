import type { EditorNode } from "@/types/editor"

export type TemplateNodeRole =
  | "navigation"
  | "hero"
  | "proof"
  | "services"
  | "process"
  | "pricing"
  | "testimonials"
  | "contact"
  | "footer"
  | "unknown"

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

export function detectTemplateNodeRole(
  node: EditorNode,
): TemplateNodeRole {
  const text = normalize(
    `${node.id} ${node.displayName ?? ""}`,
  )

  if (
    node.type === "siteNav" ||
    text.includes("menu principal") ||
    text.includes("navigation")
  ) {
    return "navigation"
  }

  if (
    text.includes("portada") ||
    text.includes("hero")
  ) {
    return "hero"
  }

  if (
    text.includes("prueba") ||
    text.includes("proof")
  ) {
    return "proof"
  }

  if (
    text.includes("servicio") ||
    text.includes("services")
  ) {
    return "services"
  }

  if (
    text.includes("proceso") ||
    text.includes("paso")
  ) {
    return "process"
  }

  if (
    text.includes("planes") ||
    text.includes("pricing") ||
    text.includes("paquete")
  ) {
    return "pricing"
  }

  if (
    text.includes("testimonio")
  ) {
    return "testimonials"
  }

  if (
    text.includes("contact")
  ) {
    return "contact"
  }

  if (
    text.includes("pie de pagina") ||
    text.includes("footer")
  ) {
    return "footer"
  }

  return "unknown"
}
