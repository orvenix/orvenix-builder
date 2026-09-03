export interface ParsedLocalEdit {
  operation:
    | "set_text"
    | "set_color"
    | "set_button_text"
    | "unknown"

  value?: string
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

function quotedValue(
  input: string,
): string | undefined {
  const match =
    input.match(
      /["“”']([^"“”']+)["“”']/,
    )

  return match?.[1]?.trim()
}

export function parseLocalEdit(
  request: string,
): ParsedLocalEdit {
  const normalized =
    normalize(request)

  const quoted =
    quotedValue(request)

  /*
   * Texto/título.
   */
  if (
    normalized.includes("titulo") ||
    normalized.includes("texto")
  ) {
    if (quoted) {
      return {
        operation:
          "set_text",

        value:
          quoted,
      }
    }
  }

  /*
   * Botón.
   */
  if (
    normalized.includes("boton") ||
    normalized.includes("cta")
  ) {
    if (quoted) {
      return {
        operation:
          "set_button_text",

        value:
          quoted,
      }
    }
  }

  /*
   * Color hexadecimal.
   */
  const hex =
    request.match(
      /#[0-9a-fA-F]{3,8}\b/,
    )?.[0]

  if (
    normalized.includes("color") &&
    hex
  ) {
    return {
      operation:
        "set_color",

      value:
        hex,
    }
  }

  return {
    operation:
      "unknown",
  }
}
