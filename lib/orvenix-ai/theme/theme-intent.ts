import type {
  GlobalTheme,
} from "@/types/editor"

export type ThemeMutationPath =
  | "colors.primary"
  | "colors.secondary"
  | "colors.background"
  | "colors.text"
  | "colors.accent"
  | "fontHeading"
  | "fontBody"
  | "spacing.sectionX"
  | "spacing.sectionY"
  | "spacing.stack"
  | "radius.card"
  | "radius.button"

export interface ParsedThemeMutation {
  path: ThemeMutationPath
  value: string
}

function normalize(
  value: string,
) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /\p{Diacritic}/gu,
      "",
    )
    .trim()
}

function extractHex(
  request: string,
) {
  return request.match(
    /#[0-9a-fA-F]{3,8}\b/,
  )?.[0]
}

function extractLastValue(
  request: string,
) {
  const match =
    request.match(
      /\b(?:a|en)\s+(.+?)\s*$/i,
    )

  return match?.[1]?.trim()
}

export function parseThemeMutation(
  request: string,
): ParsedThemeMutation | null {
  const text =
    normalize(request)

  const hex =
    extractHex(request)

  if (
    hex &&
    (
      text.includes("color principal") ||
      text.includes("primary")
    )
  ) {
    return {
      path: "colors.primary",
      value: hex,
    }
  }

  if (
    hex &&
    (
      text.includes("color secundario") ||
      text.includes("secondary")
    )
  ) {
    return {
      path: "colors.secondary",
      value: hex,
    }
  }

  if (
    hex &&
    (
      text.includes("color de fondo") ||
      text.includes("color del fondo") ||
      text.includes("background")
    )
  ) {
    return {
      path: "colors.background",
      value: hex,
    }
  }

  if (
    hex &&
    (
      text.includes("color de texto") ||
      text.includes("color del texto")
    )
  ) {
    return {
      path: "colors.text",
      value: hex,
    }
  }

  if (
    hex &&
    (
      text.includes("color de acento") ||
      text.includes("accent")
    )
  ) {
    return {
      path: "colors.accent",
      value: hex,
    }
  }

  const headingFontMatch =
  request.match(
    /(?:tipograf[ií]a|fuente)\s+de\s+t[ií]tulos\s+(?:a|en)\s+(.+?)\s*$/i,
  )

if (headingFontMatch) {
  return {
    path: "fontHeading",
    value:
      headingFontMatch[1].trim(),
  }
}

const bodyFontMatch =
  request.match(
    /(?:tipograf[ií]a|fuente)\s+del\s+cuerpo\s+(?:a|en)\s+(.+?)\s*$/i,
  )

if (bodyFontMatch) {
  return {
    path: "fontBody",
    value:
      bodyFontMatch[1].trim(),
  }
}

const value =
  extractLastValue(
    request,
  )

if (!value) {
  return null
}

  if (
    text.includes(
      "tipografia de titulos",
    ) ||
    text.includes(
      "fuente de titulos",
    )
  ) {
    return {
      path: "fontHeading",
      value,
    }
  }

  if (
    text.includes(
      "tipografia del cuerpo",
    ) ||
    text.includes(
      "fuente del cuerpo",
    )
  ) {
    return {
      path: "fontBody",
      value,
    }
  }

  if (
    text.includes(
      "espaciado vertical global",
    )
  ) {
    return {
      path: "spacing.sectionY",
      value,
    }
  }

  if (
    text.includes(
      "espaciado horizontal global",
    )
  ) {
    return {
      path: "spacing.sectionX",
      value,
    }
  }

  if (
    text.includes(
      "espaciado entre elementos",
    )
  ) {
    return {
      path: "spacing.stack",
      value,
    }
  }

  if (
    text.includes(
      "radio de las tarjetas",
    ) ||
    text.includes(
      "radio de tarjetas",
    )
  ) {
    return {
      path: "radius.card",
      value,
    }
  }

  if (
    text.includes(
      "radio de los botones",
    ) ||
    text.includes(
      "radio de botones",
    )
  ) {
    return {
      path: "radius.button",
      value,
    }
  }

  return null
}

export type {
  GlobalTheme,
}
