import { createHash } from "node:crypto";

import type { SiteCreationPlanV2 } from "@/lib/orvenix-ai/site-creation/plan-v2";
import type { EditorNode, EditorTree, GlobalTheme } from "@/types/editor";

export const DESIGN_PATTERN_V1_VERSION = 1;

export type DesignPatternLevel = "L1" | "L2" | "L3" | "L4";

export interface ExtractDesignPatternV1Input {
  initialPlan: SiteCreationPlanV2;
  industry?: string | null;
  siteType?: string | null;
  objective?: string | null;
  requestedStyle?: string | null;
}

export interface DesignPatternV1 {
  version: typeof DESIGN_PATTERN_V1_VERSION;
  context: {
    industryBucket: string | null;
    siteType: string | null;
    objectiveBucket: string | null;
    styleBucket: string | null;
  };
  architecture: {
    pageCountBucket: string;
    pageTypes: string[];
    navigationOrder: string[];
    homeSectionOrder: string[];
    requiredSections: string[];
  };
  conversion: {
    heroHasCta: boolean;
    finalCta: boolean;
    ctaCountBucket: string;
    contactPresence: boolean;
  };
  theme: {
    mode: string | null;
    accentHue: string | null;
    contrastBucket: string | null;
    radiusBucket: string | null;
    typographyBucket: string | null;
    motionBucket: string | null;
  };
  layout: {
    densityBucket: string;
    mediaPresenceBucket: string;
    sectionCountBucket: string;
  };
}

export interface ExtractedDesignPatternV1 {
  pattern: DesignPatternV1;
  patternHash: string;
}

const KNOWN_PAGE_TYPES = new Set([
  "home",
  "services",
  "about",
  "contact",
  "pricing",
  "faq",
  "gallery",
  "blog",
]);

type SectionType =
  | "navigation"
  | "hero"
  | "trust"
  | "services"
  | "features"
  | "gallery"
  | "products"
  | "pricing"
  | "testimonials"
  | "process"
  | "faq"
  | "contact"
  | "cta"
  | "footer"
  | "content";

function normalizeText(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]+/g, " ")
    .replace(/\s+/g, " ");
}

function stableObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableObject);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, stableObject(entry)]),
    );
  }

  return value;
}

export function canonicalDesignPatternJson(value: unknown) {
  return JSON.stringify(stableObject(value));
}

export function calculateDesignPatternHash(pattern: DesignPatternV1) {
  return createHash("sha256")
    .update(canonicalDesignPatternJson(pattern))
    .digest("hex");
}

export function bucketIndustry(value?: string | null) {
  const text = normalizeText(value);
  if (!text) return null;

  if (/\b(dent|dental|dentist|dentista|odont|clinica|doctor|medic|salud|terapia|psicolog)\b/.test(text)) {
    return "health";
  }

  if (/\b(restaurante|restaurant|cafeteria|cafe|comida|bar|taqueria)\b/.test(text)) {
    return "restaurant";
  }

  if (/\b(agencia|marketing|diseno|branding|publicidad|consultor)\b/.test(text)) {
    return "agency";
  }

  if (/\b(tienda|ecommerce|producto|retail|moda|catalogo)\b/.test(text)) {
    return "ecommerce";
  }

  return "other";
}

export function bucketObjective(value?: string | null) {
  const text = normalizeText(value);
  if (!text) return null;

  if (/\b(cita|citas|agenda|reservacion|reserva|whatsapp|contacto|contactar|lead|prospect)\b/.test(text)) {
    return "lead_generation";
  }

  if (/\b(vender|venta|comprar|checkout|producto|catalogo|pedido)\b/.test(text)) {
    return "sales";
  }

  if (/\b(confianza|marca|posicionar|autoridad|portafolio|presentar)\b/.test(text)) {
    return "brand_trust";
  }

  if (/\b(informar|educar|blog|contenido|explicar)\b/.test(text)) {
    return "education";
  }

  return "other";
}

export function bucketStyle(value?: string | null) {
  const text = normalizeText(value);
  if (!text) return null;

  if (/\b(premium|lujo|luxury|elegante|sofisticado)\b/.test(text)) return "premium";
  if (/\b(minimal|limpio|simple|sencillo)\b/.test(text)) return "minimal";
  if (/\b(moderno|modern|startup|tecnologico)\b/.test(text)) return "modern";
  if (/\b(calido|artesanal|humano|natural)\b/.test(text)) return "warm";
  if (/\b(corporativo|profesional|formal)\b/.test(text)) return "professional";

  return "other";
}

function bucketPageCount(count: number) {
  if (count <= 1) return "1";
  if (count <= 3) return "2-3";
  if (count <= 6) return "4-6";
  return "7+";
}

function bucketSectionCount(count: number) {
  if (count <= 3) return "0-3";
  if (count <= 6) return "4-6";
  if (count <= 9) return "7-9";
  return "10+";
}

function bucketCtaCount(count: number) {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 3) return "2-3";
  return "4+";
}

function bucketDensity(nodeCount: number, sectionCount: number) {
  const ratio = nodeCount / Math.max(sectionCount, 1);
  if (ratio <= 4) return "low";
  if (ratio <= 8) return "medium";
  return "high";
}

function bucketMediaPresence(count: number) {
  if (count <= 0) return "none";
  if (count <= 2) return "low";
  if (count <= 5) return "medium";
  return "high";
}

function normalizePageType(slug: string, isHome: boolean) {
  if (isHome) return "home";

  const normalized = normalizeText(slug).replace(/\s+/g, "-");
  if (normalized === "servicios" || normalized === "service") return "services";
  if (normalized === "nosotros" || normalized === "acerca" || normalized === "acerca-de") return "about";
  if (normalized === "contacto") return "contact";
  if (normalized === "precios" || normalized === "planes") return "pricing";
  if (normalized === "galeria") return "gallery";

  return KNOWN_PAGE_TYPES.has(normalized) ? normalized : "other";
}

function getNode(tree: EditorTree, id: string | undefined) {
  return id ? tree.nodes[id] : undefined;
}

function nodeText(node: EditorNode | undefined) {
  return normalizeText([node?.type, node?.displayName].filter(Boolean).join(" "));
}

function classifySection(node: EditorNode | undefined): SectionType {
  const text = nodeText(node);
  if (!text) return "content";
  if (node?.type === "siteNav" || /\b(nav|menu|navigation)\b/.test(text)) return "navigation";
  if (/\b(hero|portada)\b/.test(text)) return "hero";
  if (/\b(confianza|trust|logos|credibilidad)\b/.test(text)) return "trust";
  if (/\b(servicio|services)\b/.test(text)) return "services";
  if (/\b(feature|beneficio|caracteristica)\b/.test(text)) return "features";
  if (/\b(galeria|gallery)\b/.test(text)) return "gallery";
  if (/\b(producto|products)\b/.test(text)) return "products";
  if (/\b(precio|pricing|planes)\b/.test(text)) return "pricing";
  if (/\b(testimonio|testimonial)\b/.test(text)) return "testimonials";
  if (/\b(proceso|process)\b/.test(text)) return "process";
  if (/\b(faq|preguntas frecuentes)\b/.test(text)) return "faq";
  if (/\b(contacto|contact)\b/.test(text)) return "contact";
  if (/\b(cta|llamada|accion)\b/.test(text)) return "cta";
  if (/\b(footer|pie)\b/.test(text)) return "footer";
  return "content";
}

function collectDescendants(tree: EditorTree, nodeId: string): EditorNode[] {
  const node = getNode(tree, nodeId);
  if (!node) return [];

  return [
    node,
    ...node.children.flatMap((childId) => collectDescendants(tree, childId)),
  ];
}

function pageSectionOrder(tree: EditorTree) {
  const root = getNode(tree, tree.rootId);
  const children = root?.children.length ? root.children : [tree.rootId];
  return children.map((childId) => classifySection(getNode(tree, childId)));
}

function hasCtaInSection(tree: EditorTree, nodeId: string | undefined) {
  if (!nodeId) return false;
  return collectDescendants(tree, nodeId).some((node) => node.type === "ctaButton");
}

function countNodesOfType(plan: SiteCreationPlanV2, type: string) {
  return plan.pages.reduce(
    (total, page) =>
      total + Object.values(page.tree.nodes).filter((node) => node.type === type).length,
    0,
  );
}

function countTopLevelSections(plan: SiteCreationPlanV2) {
  return plan.pages.reduce((total, page) => total + pageSectionOrder(page.tree).length, 0);
}

function totalNodeCount(plan: SiteCreationPlanV2) {
  return plan.pages.reduce((total, page) => total + Object.keys(page.tree.nodes).length, 0);
}

function hexToRgb(hex: string) {
  const match = hex.trim().match(/^#?([a-f0-9]{6})$/i);
  if (!match) return null;
  const value = Number.parseInt(match[1]!, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHue({ r, g, b }: { r: number; g: number; b: number }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  return Math.round(hue * 60 + (hue < 0 ? 360 : 0));
}

function luminance(hex?: string) {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return null;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

function hueBucket(hex?: string) {
  const rgb = hex ? hexToRgb(hex) : null;
  if (!rgb) return null;
  const hue = rgbToHue(rgb);
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 45) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 165) return "green";
  if (hue < 195) return "cyan";
  if (hue < 255) return "blue";
  if (hue < 285) return "purple";
  if (hue < 345) return "pink";
  return "neutral";
}

function themeMode(theme: GlobalTheme) {
  const background = luminance(theme.colors?.background);
  if (background === null) return null;
  return background < 0.45 ? "dark" : "light";
}

function contrastBucket(theme: GlobalTheme) {
  const background = luminance(theme.colors?.background);
  const text = luminance(theme.colors?.text);
  if (background === null || text === null) return null;
  const distance = Math.abs(background - text);
  if (distance >= 0.7) return "high";
  if (distance >= 0.4) return "medium";
  return "low";
}

function numericCss(value?: string) {
  const match = value?.match(/-?\d+(\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

function radiusBucket(theme: GlobalTheme) {
  const radius = Math.max(
    numericCss(theme.radius?.card) ?? 0,
    numericCss(theme.radius?.button) ?? 0,
  );

  if (radius <= 4) return "sharp";
  if (radius <= 16) return "soft";
  return "pill";
}

function typographyBucket(theme: GlobalTheme) {
  const font = normalizeText([theme.fontHeading, theme.fontBody].filter(Boolean).join(" "));
  if (!font) return null;
  if (/\b(serif|playfair|lora|merriweather|georgia)\b/.test(font)) return "serif";
  if (/\b(mono|code|jetbrains|source code)\b/.test(font)) return "mono";
  if (/\b(display|bebas|oswald)\b/.test(font)) return "display";
  return "sans";
}

function motionBucket(theme: GlobalTheme) {
  const duration = numericCss(theme.motion?.duration);
  if (duration === null) return null;
  if (duration <= 0) return "none";
  if (duration <= 200) return "subtle";
  return "expressive";
}

export function extractDesignPatternV1(input: ExtractDesignPatternV1Input): ExtractedDesignPatternV1 {
  const plan = input.initialPlan;
  const pageTypes = [...new Set(plan.pages.map((page) => normalizePageType(page.slug, page.isHome)))].sort();
  const navigationOrder = plan.navigation.map((item) => normalizePageType(item.slug, item.slug === "home"));
  const homePage = plan.pages.find((page) => page.isHome) ?? plan.pages[0];
  const homeSectionOrder = homePage ? pageSectionOrder(homePage.tree) : [];
  const allSections = plan.pages.flatMap((page) => pageSectionOrder(page.tree));
  const requiredSections = [...new Set(allSections)].filter((section) => section !== "content").sort();
  const ctaCount = countNodesOfType(plan, "ctaButton");
  const sectionCount = countTopLevelSections(plan);
  const nodeCount = totalNodeCount(plan);
  const homeRoot = homePage ? getNode(homePage.tree, homePage.tree.rootId) : undefined;
  const homeChildren = homeRoot?.children ?? [];
  const firstHomeSection = homeChildren[0];
  const lastHomeSection = homeChildren.at(-1);

  const pattern: DesignPatternV1 = {
    version: DESIGN_PATTERN_V1_VERSION,
    context: {
      industryBucket: bucketIndustry(input.industry ?? plan.identity.industry),
      siteType: normalizeText(input.siteType) || null,
      objectiveBucket: bucketObjective(input.objective),
      styleBucket: bucketStyle(input.requestedStyle),
    },
    architecture: {
      pageCountBucket: bucketPageCount(plan.pages.length),
      pageTypes,
      navigationOrder,
      homeSectionOrder,
      requiredSections,
    },
    conversion: {
      heroHasCta: Boolean(homePage && classifySection(getNode(homePage.tree, firstHomeSection)) === "hero" && hasCtaInSection(homePage.tree, firstHomeSection)),
      finalCta: Boolean(homePage && hasCtaInSection(homePage.tree, lastHomeSection)),
      ctaCountBucket: bucketCtaCount(ctaCount),
      contactPresence: requiredSections.includes("contact"),
    },
    theme: {
      mode: themeMode(plan.theme),
      accentHue: hueBucket(plan.theme.colors?.accent ?? plan.theme.colors?.primary),
      contrastBucket: contrastBucket(plan.theme),
      radiusBucket: radiusBucket(plan.theme),
      typographyBucket: typographyBucket(plan.theme),
      motionBucket: motionBucket(plan.theme),
    },
    layout: {
      densityBucket: bucketDensity(nodeCount, sectionCount),
      mediaPresenceBucket: bucketMediaPresence(countNodesOfType(plan, "image")),
      sectionCountBucket: bucketSectionCount(sectionCount),
    },
  };

  return {
    pattern,
    patternHash: calculateDesignPatternHash(pattern),
  };
}

export function createDesignPatternLevelKey(pattern: DesignPatternV1, level: DesignPatternLevel) {
  const base = {
    version: pattern.version,
    context: pattern.context,
  };

  if (level === "L1") {
    return canonicalDesignPatternJson(base);
  }

  if (level === "L2") {
    return canonicalDesignPatternJson({
      ...base,
      theme: pattern.theme,
    });
  }

  if (level === "L3") {
    return canonicalDesignPatternJson({
      ...base,
      theme: pattern.theme,
      architecture: pattern.architecture,
    });
  }

  return canonicalDesignPatternJson(pattern);
}

export function createDesignPatternLevelHash(pattern: DesignPatternV1, level: DesignPatternLevel) {
  return createHash("sha256")
    .update(createDesignPatternLevelKey(pattern, level))
    .digest("hex");
}
