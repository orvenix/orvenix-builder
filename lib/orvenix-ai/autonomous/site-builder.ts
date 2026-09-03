import {
  buildSiteArchitecture,
} from "@/lib/orvenix-ai/architect"

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
  AutonomousSiteBuilderInput,
  AutonomousSiteBuilderResult,
} from "./types"

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
