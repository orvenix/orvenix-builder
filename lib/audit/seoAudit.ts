import type { EditorTree, EditorNode } from "@/types/editor";

const DEFAULT_OG_IMAGE = "/img/logo-main.png";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditIssue {
  id: string;
  domain: "seo" | "wcag" | "performance";
  severity: AuditSeverity;
  title: string;
  message: string;
  nodeId?: string;
  autoFixable: boolean;
  fix?: () => Record<string, unknown>; // props patch to apply
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllNodes(tree: EditorTree): EditorNode[] {
  return Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
}

function getTextContent(node: EditorNode): string {
  const p = node.props as Record<string, unknown>;
  return String(p.text ?? p.content ?? p.label ?? "");
}

function clipText(value: string, max: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, max).trim();
}

// ─── Checks SEO ───────────────────────────────────────────────────────────────

export function runSeoAudit(tree: EditorTree): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const nodes = getAllNodes(tree);
  const seo = tree.seo;
  const firstHeadingText =
    nodes
      .filter((node) => node.type === "heading")
      .map((node) => getTextContent(node))
      .find((text) => text.trim().length > 0) ?? "Nueva página";
  const textContent =
    nodes
      .filter((node) => node.type === "text")
      .map((node) => getTextContent(node))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  const firstImageSrc =
    nodes
      .filter((node) => node.type === "image")
      .map((node) => String((node.props as Record<string, unknown>).src ?? "").trim())
      .find((src) => src.length > 0) ?? "";
  const suggestedOgImage = firstImageSrc || DEFAULT_OG_IMAGE;

  // ── Título de página ────────────────────────────────────────────────────────
  if (!seo?.title || seo.title.trim().length === 0) {
    issues.push({
      id: "seo-no-title",
      domain: "seo",
      severity: "error",
      title: "Sin título de página",
      message: "El título de la página (SEO) está vacío. Google lo usa como enlace principal en los resultados de búsqueda.",
      autoFixable: true,
      fix: () => ({ title: clipText(firstHeadingText, 60) || "Nueva página" }),
    });
  } else if (seo.title.length < 30) {
    issues.push({
      id: "seo-title-short",
      domain: "seo",
      severity: "warning",
      title: "Título demasiado corto",
      message: `El título tiene ${seo.title.length} caracteres. Se recomienda entre 50-60 para máxima visibilidad en Google.`,
      autoFixable: false,
    });
  } else if (seo.title.length > 60) {
    issues.push({
      id: "seo-title-long",
      domain: "seo",
      severity: "warning",
      title: "Título demasiado largo",
      message: `El título tiene ${seo.title.length} caracteres. Google trunca los que superan 60 caracteres.`,
      autoFixable: false,
    });
  }

  // ── Meta descripción ────────────────────────────────────────────────────────
  if (!seo?.description || seo.description.trim().length === 0) {
    issues.push({
      id: "seo-no-description",
      domain: "seo",
      severity: "error",
      title: "Sin meta descripción",
      message: "La meta descripción aparece bajo el título en Google. Sin ella, Google generará una aleatoria del contenido.",
      autoFixable: textContent.length > 0,
      fix: textContent.length > 0 ? () => ({ description: clipText(textContent, 155) }) : undefined,
    });
  } else if (seo.description.length < 120) {
    issues.push({
      id: "seo-desc-short",
      domain: "seo",
      severity: "warning",
      title: "Meta descripción corta",
      message: `Solo ${seo.description.length} caracteres. Una buena descripción tiene entre 120-160 caracteres.`,
      autoFixable: false,
    });
  } else if (seo.description.length > 160) {
    issues.push({
      id: "seo-desc-long",
      domain: "seo",
      severity: "warning",
      title: "Meta descripción larga",
      message: `${seo.description.length} caracteres. Google trunca las que superan 160 caracteres.`,
      autoFixable: false,
    });
  }

  // ── H1 ──────────────────────────────────────────────────────────────────────
  const h1Nodes = nodes.filter(
    (n) => n.type === "heading" && Number((n.props as Record<string, unknown>).level) === 1
  );

  if (h1Nodes.length === 0) {
    issues.push({
      id: "seo-no-h1",
      domain: "seo",
      severity: "error",
      title: "Sin encabezado H1",
      message: "Toda página debe tener exactamente un H1. Es la señal más importante para los motores de búsqueda.",
      autoFixable: false,
    });
  } else if (h1Nodes.length > 1) {
    issues.push({
      id: "seo-multiple-h1",
      domain: "seo",
      severity: "warning",
      title: `${h1Nodes.length} encabezados H1`,
      message: "Hay más de un H1. Usa solo uno para el título principal; los demás deben ser H2 o H3.",
      autoFixable: false,
    });
  }

  // ── Imágenes sin alt ─────────────────────────────────────────────────────────
  const imagesNoAlt = nodes.filter((n) => {
    if (n.type !== "image") return false;
    const alt = String((n.props as Record<string, unknown>).alt ?? "").trim();
    return alt.length === 0;
  });

  if (imagesNoAlt.length > 0) {
    imagesNoAlt.forEach((node) => {
      issues.push({
        id: `seo-img-no-alt-${node.id}`,
        domain: "seo",
        severity: "warning",
        title: "Imagen sin texto alternativo",
        message: 'Las imágenes deben tener un atributo "alt" descriptivo para SEO y accesibilidad.',
        nodeId: node.id,
        autoFixable: true,
        fix: () => ({ alt: "Imagen decorativa" }),
      });
    });
  }

  // ── Texto muy corto (posible thin content) ───────────────────────────────────
  const textNodes = nodes.filter((n) => n.type === "text");
  const totalTextLength = textNodes.reduce((sum, n) => sum + getTextContent(n).length, 0);

  if (textNodes.length === 0) {
    issues.push({
      id: "seo-no-text",
      domain: "seo",
      severity: "info",
      title: "Sin párrafos de texto",
      message: "La página no tiene contenido textual. Google valora el contenido original y relevante.",
      autoFixable: false,
    });
  } else if (totalTextLength < 150) {
    issues.push({
      id: "seo-thin-content",
      domain: "seo",
      severity: "info",
      title: "Contenido escaso",
      message: `Solo ${totalTextLength} caracteres de texto. Considera añadir más contenido descriptivo.`,
      autoFixable: false,
    });
  }

  // ── OG Image ────────────────────────────────────────────────────────────────
  if (!seo?.ogImage) {
    issues.push({
      id: "seo-no-og-image",
      domain: "seo",
      severity: "info",
      title: "Sin imagen Open Graph",
      message: "Sin imagen OG, los enlaces compartidos en redes sociales aparecerán sin imagen.",
      autoFixable: true,
      fix: () => ({ ogImage: suggestedOgImage }),
    });
  }

  return issues;
}

// ─── Score SEO (0-100) ────────────────────────────────────────────────────────

export function calcSeoScore(issues: AuditIssue[]): number {
  const seoIssues = issues.filter((i) => i.domain === "seo");
  const penalties = seoIssues.reduce((sum, i) => {
    if (i.severity === "error")   return sum + 25;
    if (i.severity === "warning") return sum + 10;
    return sum + 3;
  }, 0);
  return Math.max(0, 100 - penalties);
}
