import {
  buildSiteArchitecture,
} from "@/lib/orvenix-ai/architect"

import {
  getDefaultStarterEditorTree,
} from "@/lib/editorWebs"

import {
  buildRealTemplateCatalog,
  rankTemplateCatalog,
  adaptArtisanTemplate,
} from "@/lib/orvenix-ai/templates"

import {
  compileSiteBlueprint,
} from "@/lib/orvenix-ai/compiler"

import {
  applyBusinessContent,
} from "@/lib/orvenix-ai/content"

import {
  evaluateTreeQuality,
} from "@/lib/orvenix-ai/quality"

import {
  buildSiteGenerationGuideContext,
  ORVENIX_SITE_CREATION_CHECKLIST,
  ORVENIX_SITE_GENERATION_GUIDE_VERSION,
} from "@/lib/orvenix-ai/guidelines/site-generation-guidelines"

import type {
  AutonomousMultiPageSiteBuilderResult,
  AutonomousSiteBuilderInput,
  AutonomousSiteBuilderResult,
} from "./types"

import {
  buildSiteCreationHref,
  normalizeSiteCreationPlanV2,
  validateSiteCreationPlanV2,
  type SiteCreationPlanV2,
} from "@/lib/orvenix-ai/site-creation/plan-v2"

import type {
  EditorTree,
  GlobalTheme,
} from "@/types/editor"

function inferRequiredCapabilities(
  siteType: string,
) {
  switch (siteType) {
    case "health":
      return [
        "citas",
        "servicios",
        "proceso",
        "faq",
      ]

    case "restaurant":
      return [
        "reservaciones",
        "menu",
        "galeria",
        "contacto",
      ]

    case "agency":
      return [
        "servicios",
        "casos de exito",
        "proceso",
        "formulario",
      ]

    case "ecommerce":
      return [
        "catalogo",
        "productos",
        "carrito",
        "checkout",
      ]

    default:
      return [
        "servicios",
        "contacto",
      ]
  }
}

export async function runAutonomousSiteBuilder(
  input: AutonomousSiteBuilderInput,
): Promise<AutonomousSiteBuilderResult> {
  const trace: string[] = []
  const warnings: string[] = []
  const generationGuide = buildSiteGenerationGuideContext({
    request: input.request,
    mode: "site",
  })

  void generationGuide

  trace.push(
    `Guia de generacion aplicada: ${ORVENIX_SITE_GENERATION_GUIDE_VERSION}`,
  )

  /*
   * 1. UNDERSTAND + ARCHITECT
   */
  trace.push("Analizando negocio con criterios de conversion")

  const architecture =
    buildSiteArchitecture({
      request: input.request,

      business: {
        name: input.business.name,
        industry: input.business.industry,
        description:
          input.business.description,
        location: input.business.location,
        audience: input.business.audience,
        objective:
          input.business.objective,
      },
    })

  trace.push(
    `Tipo de sitio detectado: ${architecture.siteType}`,
  )

  /*
   * 2. TEMPLATE INTELLIGENCE
   */
  trace.push(
    `Analizando templates con checklist: ${ORVENIX_SITE_CREATION_CHECKLIST.slice(0, 4).join(" · ")}`,
  )

  const catalog =
    buildRealTemplateCatalog()

  const ranked = input.forceFreshComposition
    ? []
    : rankTemplateCatalog(
      catalog.entries,
      {
        siteType:
          architecture.siteType,

        industry:
          architecture.industry,

        objective:
          architecture.objective,

        preferredStyle:
          input.preferredStyle ??
          "premium editable conversion-oriented",

        requiredCapabilities:
          inferRequiredCapabilities(
            architecture.siteType,
          ),
      },
    )

  if (input.forceFreshComposition) {
    trace.push("Creacion desde cero solicitada: se omite clonacion/adaptacion de templates")
  }

  const selectedTemplate =
    ranked[0] ?? null

  /*
   * 3. TEMPLATE PATH
   */
  if (
    selectedTemplate?.template.tree &&
    selectedTemplate.confidence >= 45
  ) {
    trace.push(
      `Template seleccionado: ${selectedTemplate.template.name}`,
    )

    const adaptation =
      adaptArtisanTemplate({
        tree:
          selectedTemplate.template.tree,

        business: {
          name: input.business.name,
          industry:
            input.business.industry,
          description:
            input.business.description,
          location:
            input.business.location,
          audience:
            input.business.audience,
          objective:
            input.business.objective,
          phone:
            input.business.phone,
          whatsapp:
            input.business.whatsapp,
          email:
            input.business.email,
          address:
            input.business.address,
        },

        services:
          input.business.services,

        pricing:
          input.business.pricing,

        testimonials:
          input.business.testimonials,
      })

    warnings.push(
      ...adaptation.report.warnings,
    )

    trace.push(
      `Template adaptado: ${adaptation.report.originalTemplateNodes} → ${adaptation.report.finalNodes} nodos`,
    )

    if (
      adaptation.report.removedSections.length
    ) {
      trace.push(
        `Secciones eliminadas por seguridad: ${adaptation.report.removedSections.join(", ")}`,
      )
    }

    /*
     * CONTENT PASS
     */
    const tree =
      applyBusinessContent(
        adaptation.tree,
        {
          name: input.business.name,
          industry:
            input.business.industry,
          description:
            input.business.description,
          location:
            input.business.location,
          audience:
            input.business.audience,
          objective:
            input.business.objective,
          phone:
            input.business.phone,
          whatsapp:
            input.business.whatsapp,
          email:
            input.business.email,
          address:
            input.business.address,
          page: {
            name: "Inicio",
            slug: "home",
            purpose:
              architecture.pages[0]
                ?.purpose,
          },
        },
      )

    /*
     * QUALITY
     */
    trace.push(
      "Evaluando calidad",
    )

    const quality =
      evaluateTreeQuality(tree)

    const minimumQuality =
      input.minimumQuality ?? 70

    let repaired = false

    if (
      quality.score <
      minimumQuality
    ) {
      /*
       * Por ahora registramos que necesita repair.
       * El Repair Engine real será la siguiente capa.
       */
      trace.push(
        `Calidad ${quality.score}/${100}; requiere reparación automática`,
      )

      repaired = true
    } else {
      trace.push(
        `Calidad aprobada: ${quality.score}/${100}`,
      )
    }

    return {
      /*
       * "ok" significa que Orvenix AI pudo
       * producir un árbol utilizable.
       *
       * Las advertencias no bloquean por sí
       * solas una generación. Safety Validator
       * y Mutation Policy deciden si puede
       * ejecutarse.
       */
      ok: true,

      architecture,
      selectedTemplate,
      tree,
      quality,
      repaired,
      warnings,
      trace,
    }
  }

  /*
   * 4. FALLBACK
   *
   * Si no existe template suficientemente bueno,
   * construimos desde Site Architect + Composer.
   */
  trace.push(
    "No existe un template suficientemente compatible; usando composicion autonoma guiada por conversion",
  )

  const blueprint =
    compileSiteBlueprint(
      architecture,
      {
        preferPrimitiveComposition: input.forceFreshComposition,
      },
    )

  const home =
    blueprint.pages[0]

  if (!home) {
    throw new Error(
      "Orvenix AI no pudo generar la página principal.",
    )
  }

  const tree =
    applyBusinessContent(
      home.tree,
      {
        name: input.business.name,
        industry:
          input.business.industry,
        description:
          input.business.description,
        location:
          input.business.location,
        audience:
          input.business.audience,
        objective:
          input.business.objective,
        phone:
          input.business.phone,
        whatsapp:
          input.business.whatsapp,
        email:
          input.business.email,
        address:
          input.business.address,

        page: {
          name: home.name,
          slug: home.slug,
          purpose:
            architecture.pages[0]
              ?.purpose,
        },
      },
    )

  const quality =
    evaluateTreeQuality(tree)

  return {
    ok: true,

    architecture,
    selectedTemplate: null,
    tree,
    quality,

    repaired:
      quality.score <
      (input.minimumQuality ?? 70),

    warnings:
      blueprint.warnings,

    trace,
  }
}

function getStarterTheme(): GlobalTheme {
  const starter = getDefaultStarterEditorTree()
  const theme = starter.globalTheme ?? starter.theme

  if (!theme) {
    return {}
  }

  return structuredClone(theme)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

const MEMORY_HUE_TOKENS: Record<string, { primary: string; secondary: string; accent: string }> = {
  red: { primary: "#dc2626", secondary: "#991b1b", accent: "#f87171" },
  orange: { primary: "#ea580c", secondary: "#9a3412", accent: "#fb923c" },
  yellow: { primary: "#ca8a04", secondary: "#854d0e", accent: "#facc15" },
  green: { primary: "#16a34a", secondary: "#166534", accent: "#4ade80" },
  cyan: { primary: "#0891b2", secondary: "#155e75", accent: "#22d3ee" },
  blue: { primary: "#1794CC", secondary: "#1379A8", accent: "#1BB3FA" },
  purple: { primary: "#7c3aed", secondary: "#5b21b6", accent: "#a78bfa" },
  pink: { primary: "#db2777", secondary: "#9d174d", accent: "#f472b6" },
  neutral: { primary: "#334155", secondary: "#0f172a", accent: "#64748b" },
}

function themeColors(theme: GlobalTheme): NonNullable<GlobalTheme["colors"]> {
  return theme.colors ?? {
    primary: "#1794CC",
    secondary: "#1379A8",
    background: "#ffffff",
    text: "#0f172a",
    accent: "#1BB3FA",
  }
}

function themeMotion(theme: GlobalTheme): NonNullable<GlobalTheme["motion"]> {
  return theme.motion ?? {
    duration: "180ms",
    easing: "ease",
  }
}

function applyThemeDirection(theme: GlobalTheme, direction: Record<string, unknown>): GlobalTheme {
  const next = structuredClone(theme)

  if (typeof direction.accentHue === "string") {
    const tokens = MEMORY_HUE_TOKENS[direction.accentHue]

    if (tokens) {
      next.colors = {
        ...themeColors(next),
        primary: tokens.primary,
        secondary: tokens.secondary,
        accent: tokens.accent,
      }
    }
  }

  if (direction.mode === "dark") {
    next.colors = {
      ...themeColors(next),
      background: "#06131f",
      text: "#f8fafc",
    }
  } else if (direction.mode === "light") {
    next.colors = {
      ...themeColors(next),
      background: "#ffffff",
      text: "#0f172a",
    }
  }

  if (direction.radiusBucket === "sharp") {
    next.radius = { ...(next.radius ?? {}), card: "4px", button: "6px" }
  } else if (direction.radiusBucket === "soft") {
    next.radius = { ...(next.radius ?? {}), card: "16px", button: "999px" }
  } else if (direction.radiusBucket === "pill") {
    next.radius = { ...(next.radius ?? {}), card: "24px", button: "999px" }
  }

  if (direction.typographyBucket === "serif") {
    next.fontHeading = "Playfair Display"
    next.fontBody = next.fontBody || "Inter"
  } else if (direction.typographyBucket === "mono") {
    next.fontHeading = "JetBrains Mono"
    next.fontBody = "Inter"
  } else if (direction.typographyBucket === "display") {
    next.fontHeading = "Oswald"
    next.fontBody = next.fontBody || "Inter"
  } else if (direction.typographyBucket === "sans") {
    next.fontHeading = "Inter"
    next.fontBody = "Inter"
  }

  if (direction.motionBucket === "none") {
    next.motion = { ...themeMotion(next), duration: "0ms" }
  } else if (direction.motionBucket === "subtle") {
    next.motion = { ...themeMotion(next), duration: "180ms" }
  } else if (direction.motionBucket === "expressive") {
    next.motion = { ...themeMotion(next), duration: "320ms" }
  }

  return next
}

function applySiteCreationThemeAdvisories(theme: GlobalTheme, input: AutonomousSiteBuilderInput): GlobalTheme {
  const prior = input.designMemoryPrior

  if (prior?.level === "L2" && isPlainRecord(prior.recommendation.theme)) {
    return applyThemeDirection(theme, prior.recommendation.theme)
  }

  const externalTheme = input.externalThemeAdvisory?.theme
  if (isPlainRecord(externalTheme)) {
    return applyThemeDirection(theme, externalTheme)
  }

  return theme
}

function businessContextForPage(params: {
  input: AutonomousSiteBuilderInput
  page: { name: string; slug: string }
  purpose?: string
}) {
  const {
    input,
    page,
    purpose,
  } = params

  return {
    name: input.business.name,
    industry: input.business.industry,
    description: input.business.description,
    location: input.business.location,
    audience: input.business.audience,
    objective: input.business.objective,
    phone: input.business.phone,
    whatsapp: input.business.whatsapp,
    email: input.business.email,
    address: input.business.address,
    page: {
      name: page.name,
      slug: page.slug,
      purpose,
    },
  }
}

function omitUndefinedValues(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitUndefinedValues)
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => typeof entry !== "undefined")
        .map(([key, entry]) => [key, omitUndefinedValues(entry)]),
    )
  }

  return value
}

function averageScore(scores: number[]) {
  if (!scores.length) return 0

  return Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  )
}

function createMultiPagePlan(params: {
  input: AutonomousSiteBuilderInput
  pages: Array<{ name: string; slug: string; tree: EditorTree }>
  pageQuality: Array<{ slug: string; score: number }>
  warnings: string[]
}): SiteCreationPlanV2 {
  const {
    input,
    pages,
    pageQuality,
    warnings,
  } = params
  const theme = applySiteCreationThemeAdvisories(getStarterTheme(), input)

  return normalizeSiteCreationPlanV2({
    version: 2,
    identity: {
      name: input.business.name?.trim() || "Sitio Orvenix",
      ...(typeof input.business.industry !== "undefined" ? { industry: input.business.industry } : {}),
      ...(typeof input.business.location !== "undefined" ? { location: input.business.location } : {}),
      ...(typeof input.business.description !== "undefined" || input.request ? { description: input.business.description || input.request } : {}),
    },
    theme,
    navigation: pages.map((page) => ({
      label: page.name,
      slug: page.slug,
      href: buildSiteCreationHref(page.slug),
    })),
    pages: pages.map((page) => ({
      slug: page.slug,
      name: page.name,
      isHome: page.slug === "home",
      seo: {
        title: page.tree.seo?.title || page.name,
        description:
          page.tree.seo?.description ||
          input.business.description ||
          input.request,
      },
      tree: page.tree,
      treeHash: "0".repeat(64),
    })),
    quality: {
      score: averageScore(pageQuality.map((page) => page.score)),
      warnings,
      summary: `Plan multipagina generado en memoria para ${input.business.name?.trim() || "el negocio"}.`,
    },
  })
}

export async function runAutonomousMultiPageSiteBuilder(
  input: AutonomousSiteBuilderInput,
): Promise<AutonomousMultiPageSiteBuilderResult> {
  const trace: string[] = []
  const warnings: string[] = []
  const generationGuide = buildSiteGenerationGuideContext({
    request: input.request,
    mode: "site",
  })

  void generationGuide

  trace.push(
    `Guia de generacion aplicada: ${ORVENIX_SITE_GENERATION_GUIDE_VERSION}`,
  )
  trace.push(
    "Generando arquitectura multipagina en memoria",
  )

  const architecture = buildSiteArchitecture({
    request: input.request,
    business: {
      name: input.business.name,
      industry: input.business.industry,
      description: input.business.description,
      location: input.business.location,
      audience: input.business.audience,
      objective: input.business.objective,
      services: input.business.services,
    },
  })

  trace.push(
    `Tipo de sitio detectado: ${architecture.siteType}`,
  )

  const blueprint = compileSiteBlueprint(
    architecture,
    {
      preferPrimitiveComposition: input.forceFreshComposition,
    },
  )

  warnings.push(...blueprint.warnings)
  trace.push(
    `Blueprint multipagina compilado: ${blueprint.pages.length} paginas`,
  )

  if (input.designMemoryPrior?.level === "L2") {
    trace.push("Theme advisory aplicado desde Design Memory L2")
  } else if (input.externalThemeAdvisory) {
    trace.push("Theme advisory aplicado desde Third-Party Assistance")
  }

  const pages = blueprint.pages.map((page) => {
    const pagePlan = architecture.pages.find(
      (item) => item.slug === page.slug,
    )
    const tree = applyBusinessContent(
      page.tree,
      businessContextForPage({
        input,
        page,
        purpose: pagePlan?.purpose,
      }),
    )

    return {
      name: page.name,
      slug: page.slug,
      tree: omitUndefinedValues(tree) as EditorTree,
    }
  })

  const pageQuality = pages.map((page) => {
    const quality = evaluateTreeQuality(page.tree)

    if (quality.problems.length) {
      warnings.push(
        ...quality.problems.map((problem) => `${page.slug}: ${problem}`),
      )
    }

    return {
      slug: page.slug,
      score: quality.score,
    }
  })

  const plan = createMultiPagePlan({
    input,
    pages,
    pageQuality,
    warnings,
  })
  const validation = validateSiteCreationPlanV2(plan, {
    maxPages: Math.max(architecture.pages.length, 1),
    maxBytes: 1_000_000,
  })

  if (validation.ok === false) {
    throw new Error(
      `Orvenix AI no pudo producir un plan multipagina valido: ${validation.errors.join("; ")}`,
    )
  }

  const minimumQuality = input.minimumQuality ?? 70
  const repaired = pageQuality.some(
    (page) => page.score < minimumQuality,
  )

  trace.push(
    `Plan V2 validado: ${validation.plan.pages.length} paginas, ${validation.byteLength} bytes`,
  )

  return {
    ok: true,
    architecture,
    selectedTemplate: null,
    plan: validation.plan,
    planHash: validation.planHash,
    byteLength: validation.byteLength,
    pageQuality,
    repaired,
    warnings: [...new Set([...warnings, ...validation.warnings])],
    trace,
  }
}
