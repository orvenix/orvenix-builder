import type {
  ParsedDesignIntent,
} from "./types"

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

export function parseDesignIntent(
  request: string,
): ParsedDesignIntent {
  const text =
    normalize(request)

  if (
    text.includes("premium") ||
    text.includes("lujoso") ||
    text.includes("lujosa") ||
    text.includes("de lujo")
  ) {
    return {
      intent: "premium",
      confidence: 1,
    }
  }

  if (
    text.includes("minimalista") ||
    text.includes("minimal")
  ) {
    return {
      intent: "minimal",
      confidence: 1,
    }
  }

  if (
    text.includes("moderno") ||
    text.includes("moderna") ||
    text.includes("moderniza")
  ) {
    return {
      intent: "modern",
      confidence: 1,
    }
  }

  if (
    text.includes("elegante") ||
    text.includes("sofisticado") ||
    text.includes("sofisticada")
  ) {
    return {
      intent: "elegant",
      confidence: 1,
    }
  }

  if (
    text.includes("compacto") ||
    text.includes("compacta") ||
    text.includes("menos espacio") ||
    text.includes("menos espaciado")
  ) {
    return {
      intent: "compact",
      confidence: 1,
    }
  }

  if (
    text.includes("espacioso") ||
    text.includes("espaciosa") ||
    text.includes("mas espacio") ||
    text.includes("mas espaciado")
  ) {
    return {
      intent: "spacious",
      confidence: 1,
    }
  }

  return {
    intent: "unknown",
    confidence: 0,
  }
}
