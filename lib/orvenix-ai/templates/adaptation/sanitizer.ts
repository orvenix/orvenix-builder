import type {
  EditorNode,
} from "@/types/editor"

const UNSAFE_PATTERNS = [
  /\b\d(?:\.\d)?\s*\/\s*5\b/i,
  /\b\d+\s*(?:años|years)\b/i,
  /\b\d+\+?\s*(?:clientes|pacientes|proyectos|casos)\b/i,
  /cedula[s]?\s+verificada[s]?/i,
  /seguros?\s+aceptados?/i,
  /garantia[s]?/i,
  /certificad[oa]s?/i,
  /premiad[oa]s?/i,
]

const TEMPLATE_LANGUAGE = [
  /plantilla editable/i,
  /personalizar/i,
  /desde el editor/i,
  /son reemplazables/i,
  /preparados? para vender/i,
  /ajusta especialidades/i,
  /describe la oferta/i,
  /presenta una opcion/i,
]

function stringValues(
  node: EditorNode,
): string[] {
  const result: string[] = []

  function walk(value: unknown) {
    if (typeof value === "string") {
      result.push(value)
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item)
      }
      return
    }

    if (
      value &&
      typeof value === "object"
    ) {
      for (
        const item
        of Object.values(
          value as Record<string, unknown>,
        )
      ) {
        walk(item)
      }
    }
  }

  walk(node.props)

  return result
}

export interface SanitizerInspection {
  unsafeFact: boolean
  templateLanguage: boolean
  reasons: string[]
}

export function inspectTemplateNode(
  node: EditorNode,
): SanitizerInspection {
  const values = stringValues(node)
  const reasons: string[] = []

  let unsafeFact = false
  let templateLanguage = false

  for (const value of values) {
    for (const pattern of UNSAFE_PATTERNS) {
      if (pattern.test(value)) {
        unsafeFact = true
        reasons.push(
          `Posible afirmación no transferible: ${value}`,
        )
        break
      }
    }

    for (
      const pattern
      of TEMPLATE_LANGUAGE
    ) {
      if (pattern.test(value)) {
        templateLanguage = true
        reasons.push(
          `Lenguaje de plantilla detectado: ${value}`,
        )
        break
      }
    }
  }

  return {
    unsafeFact,
    templateLanguage,
    reasons,
  }
}
