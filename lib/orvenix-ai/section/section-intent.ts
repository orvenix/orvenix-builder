import type {
  SectionRole,
} from "@/lib/orvenix-ai/architect"

export type SectionOperation =
  | "add"
  | "remove"
  | "replace"
  | "move"
  | "duplicate"
  | "reorder"
  | "unknown"

export interface ParsedSectionIntent {
  operation: SectionOperation

  role?: SectionRole

  direction?:
  | "first"
  | "last"
  | "up"
  | "down"

  placement?: {
    after?: string
    before?: string
  }
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
}

function detectRole(
  text: string,
): SectionRole | undefined {
  if (
    text.includes("hero") ||
    text.includes("portada") ||
    text.includes("encabezado principal") ||
    text.includes("seccion inicial") ||
    text.includes("inicio")
  ) {
    return "hero"
  }

  if (
    text.includes("precio") ||
    text.includes("precios") ||
    text.includes("planes") ||
    text.includes("paquetes") ||
    text.includes("membresia")
  ) {
    return "pricing"
  }

  if (
    text.includes("cta") ||
    text.includes("llamada a la accion") ||
    text.includes("cierre de venta")
  ) {
    return "cta"
  }

  if (
    text.includes("producto") ||
    text.includes("productos") ||
    text.includes("catalogo") ||
    text.includes("tienda")
  ) {
    return "products"
  }

  if (
    text.includes("caracteristica") ||
    text.includes("caracteristicas") ||
    text.includes("beneficio") ||
    text.includes("beneficios")
  ) {
    return "features"
  }

  if (
    text.includes("faq") ||
    text.includes("preguntas frecuentes")
  ) {
    return "faq"
  }

  if (
    text.includes("galeria") ||
    text.includes("portfolio")
  ) {
    return "gallery"
  }

  if (
    text.includes("confianza") ||
    text.includes("prueba social")
  ) {
    return "trust"
  }

  if (text.includes("servicios")) {
    return "services"
  }

  if (text.includes("testimonios")) {
    return "testimonials"
  }

  if (text.includes("contacto")) {
    return "contact"
  }

  if (text.includes("proceso")) {
    return "process"
  }

  return undefined
}

function cleanPlacementTarget(
  value?: string,
) {
  if (!value) return undefined

  return value
    .replace(
      /\b(?:y|luego|despues|después|ahora)\b.*$/i,
      "",
    )
    .trim()
}

export function parseSectionIntent(
  request: string,
): ParsedSectionIntent {
  const text = normalize(request)

  const role = detectRole(text)

  let operation:
    ParsedSectionIntent["operation"] =
      "unknown"

  /*
   * Orden importante:
   * duplicate/move/reorder antes que add/remove.
   */

  if (
    text.includes("duplica") ||
    text.includes("duplicala") ||
    text.includes("duplicalo") ||
    text.includes("copia esta seccion") ||
    text.includes("copia la seccion")
  ) {
    operation = "duplicate"
  } else if (
    text.includes("mueve") ||
    text.includes("mover") ||
    text.includes("coloca") ||
    text.includes("ponla") ||
    text.includes("ponlo")
  ) {
    operation = "move"
  } else if (
    text.includes("reordena") ||
    text.includes("reordenar") ||
    text.includes("cambia el orden") ||
    text.includes("ordena las secciones")
  ) {
    operation = "reorder"
  } else if (
    text.includes("rehaz") ||
    text.includes("reemplaza")
  ) {
    operation = "replace"
  } else if (
    text.includes("elimina") ||
    text.includes("borra") ||
    text.includes("quita")
  ) {
    operation = "remove"
  } else if (
    text.includes("agrega") ||
    text.includes("agregar") ||
    text.includes("anade") ||
    text.includes("anadir") ||
    text.includes("inserta") ||
    text.includes("insertar") ||
    text.includes("crea") ||
    text.includes("crear") ||
    text.includes("genera") ||
    text.includes("generar") ||
    text.includes("disena") ||
    text.includes("disenar") ||
    text.includes("haz una seccion") ||
    text.includes("hazme una seccion") ||
    text.includes("haz un bloque")
  ) {
    operation = "add"
  }

  const placement:
    ParsedSectionIntent["placement"] = {}

  const afterMatch =
    text.match(
      /despues de ([a-z0-9\s]+)/,
    )

  if (afterMatch?.[1]) {
    placement.after =
      cleanPlacementTarget(
        afterMatch[1],
      )
  }

  const beforeMatch =
    text.match(
      /antes de ([a-z0-9\s]+)/,
    )

  if (beforeMatch?.[1]) {
    placement.before =
      cleanPlacementTarget(
        beforeMatch[1],
      )
  }

  const aboveMatch =
  text.match(
    /arriba de ([a-z0-9\s]+)/,
  )

if (
  aboveMatch?.[1] &&
  !placement.before
) {
  placement.before =
    cleanPlacementTarget(
      aboveMatch[1],
    )
}

const belowMatch =
  text.match(
    /(?:debajo de|abajo de) ([a-z0-9\s]+)/,
  )

if (
  belowMatch?.[1] &&
  !placement.after
) {
  placement.after =
    cleanPlacementTarget(
      belowMatch[1],
    )
}

let direction:
  ParsedSectionIntent["direction"]

if (
  text.includes("al principio") ||
  text.includes("al inicio") ||
  text.includes("primera posicion")
) {
  direction = "first"
}

if (
  text.includes("al final") ||
  text.includes("ultima posicion")
) {
  direction = "last"
}

if (
  text.includes("sube") ||
  text.includes("subela") ||
  text.includes("una posicion arriba")
) {
  direction = "up"
}

if (
  text.includes("baja") ||
  text.includes("bajala") ||
  text.includes("una posicion abajo")
) {
  direction = "down"
}

/*
 * IMPORTANTE:
 * direction gana sobre "move".
 */
if (direction) {
  operation = "reorder"
}

  return {
  operation,
  role,
  placement,
  direction,
}
}