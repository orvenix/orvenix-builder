export type HtmlValidationSeverity = "error" | "warning";

export interface HtmlValidationIssue {
  code: string;
  severity: HtmlValidationSeverity;
  message: string;
}

export interface HtmlValidationReport {
  valid: boolean;
  errors: number;
  warnings: number;
  issues: HtmlValidationIssue[];
}

function countMatches(input: string, pattern: RegExp): number {
  return input.match(pattern)?.length ?? 0;
}

function extractIds(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
}

function extractHeadingLevels(html: string): number[] {
  return [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
}

export function validateHtmlExport(html: string): HtmlValidationReport {
  const issues: HtmlValidationIssue[] = [];

  const push = (severity: HtmlValidationSeverity, code: string, message: string) => {
    issues.push({ severity, code, message });
  };

  if (!/^\s*<!DOCTYPE html>/i.test(html)) {
    push("error", "doctype-missing", "El documento exportado debe comenzar con <!DOCTYPE html>.");
  }

  if (!/<html\b[^>]*\slang="[^"]+"/i.test(html)) {
    push("error", "html-lang-missing", "La etiqueta <html> debe incluir un atributo lang.");
  }

  if (!/<meta\s+charset=/i.test(html)) {
    push("error", "charset-missing", "Falta la declaración de charset en el head.");
  }

  if (!/<meta\s+name="viewport"/i.test(html)) {
    push("warning", "viewport-missing", "Falta la meta viewport para responsive básico.");
  }

  const titleCount = countMatches(html, /<title>/gi);
  if (titleCount === 0) {
    push("error", "title-missing", "El documento debe incluir un <title>.");
  }
  if (titleCount > 1) {
    push("error", "title-duplicate", "El documento no debe incluir múltiples <title>.");
  }

  const mainCount = countMatches(html, /<main\b/gi);
  if (mainCount === 0) {
    push("error", "main-missing", "El HTML exportado debe incluir un landmark <main>.");
  }
  if (mainCount > 1) {
    push("warning", "main-duplicate", "Se detectó más de un <main>; normalmente debería existir solo uno.");
  }

  const h1Count = countMatches(html, /<h1\b/gi);
  if (h1Count === 0) {
    push("warning", "h1-missing", "No se detectó ningún <h1> en el HTML exportado.");
  }
  if (h1Count > 1) {
    push("warning", "h1-duplicate", "Se detectó más de un <h1> en el documento.");
  }

  const ids = extractIds(html);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  duplicates.forEach((id) => {
    push("error", "duplicate-id", `El id "${id}" aparece más de una vez en el documento.`);
  });

  const headings = extractHeadingLevels(html);
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] > headings[i - 1] + 1) {
      push("warning", "heading-skip", "La jerarquía de headings salta niveles y puede confundir la estructura semántica.");
      break;
    }
  }

  const canonicalMatch = html.match(/<link\s+rel="canonical"[^>]*href="([^"]*)"/i);
  if (canonicalMatch && !canonicalMatch[1].trim()) {
    push("warning", "canonical-empty", "Se detectó un canonical vacío; debe omitirse o apuntar a una URL real.");
  }

  for (const match of html.matchAll(/<img\b([^>]*?)>/gi)) {
    if (!/\salt="/i.test(match[1])) {
      push("error", "img-alt-missing", "Se detectó una imagen sin atributo alt.");
      break;
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*?)target="_blank"([^>]*?)>/gi)) {
    const attrs = `${match[1]} ${match[2]}`;
    if (!/rel="[^"]*noopener/i.test(attrs)) {
      push("error", "blank-link-rel-missing", "Los enlaces con target=\"_blank\" deben incluir rel=\"noopener\".");
      break;
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.length - errors;

  return {
    valid: errors === 0,
    errors,
    warnings,
    issues,
  };
}
