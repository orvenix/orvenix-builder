import {
  REAL_TEMPLATES,
} from "@/lib/realTemplates"

import {
  getEditorTreeForWeb,
} from "@/lib/editorWebs"

import type {
  OrvenixTemplateCatalogEntry,
  TemplateCatalogSource,
} from "./catalog"

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

function inferSiteTypes(
  id: string,
  category: string,
  description: string,
): string[] {
  const text = normalize(
    `${id} ${category} ${description}`,
  )

  const types = new Set<string>()

  /*
   * Sectores específicos primero.
   * Evitamos que palabras genéricas como
   * "agencia" clasifiquen mal el negocio.
   */

  if (
    text.includes("viajes") ||
    text.includes("turismo") ||
    text.includes("destinos") ||
    text.includes("iata")
  ) {
    types.add("travel")
  }

  if (
    text.includes("hotel") ||
    text.includes("hospitalidad") ||
    text.includes("habitaciones")
  ) {
    types.add("hotel")
    types.add("hospitality")
  }

  if (
    text.includes("restaurante") ||
    text.includes("gastronom") ||
    text.includes("menu interactivo")
  ) {
    types.add("restaurant")
  }

  if (
    text.includes("clinica") ||
    text.includes("medica") ||
    text.includes("healthcare") ||
    text.includes("wellness")
  ) {
    types.add("health")
  }

  if (
    text.includes("gimnasio") ||
    text.includes("fitness")
  ) {
    types.add("fitness")
  }

  if (
    text.includes("tienda") ||
    text.includes("storefront") ||
    text.includes("checkout")
  ) {
    types.add("ecommerce")
  }

  if (
    text.includes("inmobiliaria") ||
    text.includes("real estate") ||
    text.includes("propiedades")
  ) {
    types.add("real-estate")
  }

  if (
    text.includes("academia") ||
    text.includes("educacion") ||
    text.includes("elearning")
  ) {
    types.add("education")
  }

  if (
    text.includes("abogados") ||
    text.includes("legal") ||
    text.includes("notaria")
  ) {
    types.add("legal")
  }

  /*
   * Agencia de marketing solo cuando existe
   * evidencia de marketing/digital/growth.
   */
  if (
    text.includes("marketing") ||
    text.includes("growth agency") ||
    text.includes("agencia digital")
  ) {
    types.add("agency")
  }

  if (
    text.includes("arquitectura") ||
    text.includes("contable") ||
    text.includes("rrhh") ||
    text.includes("servicios profesionales") ||
    text.includes("consultoria")
  ) {
    types.add("professional-services")
  }

  if (types.size === 0) {
    types.add("business")
  }

  return [...types]
}

export function buildRealTemplateCatalog():
  TemplateCatalogSource {
  const entries:
    OrvenixTemplateCatalogEntry[] =
    REAL_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,

      kind: "site",
      source: "realTemplates",

      tags: [
        template.category,
        ...template.features,
      ],

      siteTypes: inferSiteTypes(
        template.id,
        template.category,
        template.description,
      ),

      editorWebId: template.id,

      /*
       * Este es el punto poderoso:
       * obtenemos el EditorTree real del template.
       */
      tree: getEditorTreeForWeb(
        template.id,
      ),

      metadata: {
        livePath: template.livePath,
        accent: template.accent,
        gradient: template.gradient,
        preview: template.preview,
        features: template.features,
        purchasePriceMxn:
          template.purchasePriceMxn,
        rentalPriceMxn:
          template.rentalPriceMxn,
      },
    }))

  return {
    source: "realTemplates",
    entries,
  }
}
