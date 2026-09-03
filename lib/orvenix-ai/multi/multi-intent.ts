export type MultiTarget =
  | "buttons"
  | "headings"
  | "texts"
  | "sections"
  | "unknown"

export interface ParsedMultiEdit {
  target: MultiTarget

  operation:
    | "set_color"
    | "set_align"
    | "set_size"
    | "set_weight"
    | "set_padding_y"
    | "set_padding_x"
    | "set_margin_y"
    | "set_shadow"
    | "set_border_radius"
    | "set_max_width"
    | "set_variant"
    | "set_button_size"
    | "unknown"

  value?: string
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

export function parseMultiEdit(
  request: string,
): ParsedMultiEdit {
  const text =
    normalize(request)

  let target:
    MultiTarget =
      "unknown"

  /*
   * TARGET
   */
  if (
    text.includes(
      "todos los botones",
    ) ||
    text.includes(
      "todos los cta",
    )
  ) {
    target =
      "buttons"
  } else if (
    text.includes(
      "todos los titulos",
    ) ||
    text.includes(
      "todos los headings",
    )
  ) {
    target =
      "headings"
  } else if (
    text.includes(
      "todos los textos",
    )
  ) {
    target =
      "texts"
  } else if (
    text.includes(
      "todas las secciones",
    ) ||
    text.includes(
      "secciones",
    )
  ) {
    target =
      "sections"
  }

  const variantMatch =
  text.match(
    /\b(?:variante|estilo)(?:\s+de)?(?:\s+todos\s+los\s+botones)?(?:\s+en)?\s+(primary|secondary|ghost|principal|secundario|fantasma)\b/,
  )

if (
  target === "buttons" &&
  variantMatch
) {
  const aliases:
    Record<string, string> = {
      principal: "primary",
      secundario: "secondary",
      fantasma: "ghost",
    }

  const raw =
    variantMatch[1]

  return {
    target,
    operation:
      "set_variant",

    value:
      aliases[raw] ?? raw,
  }
}

  /*
   * SECTION — PADDING Y
   *
   * Debe resolverse antes que size porque
   * md / lg / xl existen en ambos dominios.
   */
  if (
    target ===
    "sections"
  ) {
    const paddingYMatch =
      text.match(
        /\b(?:paddingy|padding y|espaciado vertical)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(none|sm|md|lg|xl)\b/,
      )

    if (paddingYMatch) {
      return {
        target,

        operation:
          "set_padding_y",

        value:
          paddingYMatch[1],
      }
    }
  }

  const buttonSizeMatch =
  text.match(
    /\b(?:tamano|size)(?:\s+de)?(?:\s+todos\s+los\s+botones)?(?:\s+en)?\s+(sm|md|lg|pequeno|mediano|grande)\b/,
  )

if (
  target === "buttons" &&
  buttonSizeMatch
) {
  const aliases:
    Record<string, string> = {
      pequeno: "sm",
      mediano: "md",
      grande: "lg",
    }

  const raw =
    buttonSizeMatch[1]

  return {
    target,
    operation:
      "set_button_size",
    value:
      aliases[raw] ?? raw,
  }
}

  /*
   * HEADING — SIZE
   */
  if (
    target ===
    "headings"
  ) {
    const sizeMatch =
      text.match(
        /\b(5xl|4xl|3xl|2xl|xl|lg|md)\b/,
      )

    if (sizeMatch) {
      return {
        target,

        operation:
          "set_size",

        value:
          sizeMatch[1],
      }
    }
  }

  /*
   * COLOR
   */
  const hex =
    request.match(
      /#[0-9a-fA-F]{3,8}\b/,
    )?.[0]

  if (
    text.includes(
      "color",
    ) &&
    hex
  ) {
    return {
      target,

      operation:
        "set_color",

      value:
        hex,
    }
  }

  /*
   * ALIGN
   */
  if (
    text.includes(
      "centra",
    ) ||
    text.includes(
      "centrar",
    ) ||
    text.includes(
      "centrados",
    ) ||
    text.includes(
      "centradas",
    )
  ) {
    return {
      target,

      operation:
        "set_align",

      value:
        "center",
    }
  }

  if (
    text.includes(
      "a la izquierda",
    )
  ) {
    return {
      target,

      operation:
        "set_align",

      value:
        "left",
    }
  }

  if (
    text.includes(
      "a la derecha",
    )
  ) {
    return {
      target,

      operation:
        "set_align",

      value:
        "right",
    }
  }

  /*
   * WEIGHT
   */
  if (
    text.includes(
      "extra bold",
    ) ||
    text.includes(
      "extrabold",
    )
  ) {
    return {
      target,

      operation:
        "set_weight",

      value:
        "extrabold",
    }
  }

  if (
    text.includes(
      "semi bold",
    ) ||
    text.includes(
      "semibold",
    )
  ) {
    return {
      target,

      operation:
        "set_weight",

      value:
        "semibold",
    }
  }

  if (
    text.includes(
      "negrita",
    ) ||
    text.includes(
      "bold",
    )
  ) {
    return {
      target,

      operation:
        "set_weight",

      value:
        "bold",
    }
  }

  if (
    text.includes(
      "peso medio",
    ) ||
    text.includes(
      "medium",
    )
  ) {
    return {
      target,

      operation:
        "set_weight",

      value:
        "medium",
    }
  }

  if (
    text.includes(
      "peso normal",
    )
  ) {
    return {
      target,

      operation:
        "set_weight",

      value:
        "normal",
    }
  }

  const paddingXMatch =
  text.match(
    /\b(?:paddingx|padding x|espaciado horizontal)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(none|sm|md|lg|xl)\b/,
  )

if (paddingXMatch) {
  return {
    target,
    operation: "set_padding_x",
    value: paddingXMatch[1],
  }
}

const marginYMatch =
  text.match(
    /\b(?:marginy|margin y|margen vertical)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(none|sm|md|lg|xl)\b/,
  )

if (marginYMatch) {
  return {
    target,
    operation: "set_margin_y",
    value: marginYMatch[1],
  }
}

const shadowMatch =
  text.match(
    /\b(?:sombra)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(none|sm|md|lg|xl)\b/,
  )

if (shadowMatch) {
  return {
    target,
    operation: "set_shadow",
    value: shadowMatch[1],
  }
}

const radiusMatch =
  text.match(
    /\b(?:bordes redondeados|border radius|borderradius)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(none|sm|md|lg|xl)\b/,
  )

if (radiusMatch) {
  return {
    target,
    operation: "set_border_radius",
    value: radiusMatch[1],
  }
}

const maxWidthMatch =
  text.match(
    /\b(?:ancho maximo|maxwidth|max width)(?:\s+de)?(?:\s+todas\s+las\s+secciones)?(?:\s+en)?\s+(sm|md|lg|xl|full)\b/,
  )

if (maxWidthMatch) {
  return {
    target,
    operation: "set_max_width",
    value: maxWidthMatch[1],
  }
}

  return {
    target,

    operation:
      "unknown",
  }
}
