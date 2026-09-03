import type {
  BusinessContentContext,
} from "./types"

function normalize(value?: string) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

export interface BusinessLanguage {
  categorySingular: string
  categoryPlural: string
  servicePlural: string
  clientWord: string
  primaryAction: string
  secondaryAction: string
}

export function getBusinessLanguage(
  context: BusinessContentContext,
): BusinessLanguage {
  const industry = normalize(context.industry)

  if (
    industry.includes("dental") ||
    industry.includes("dentista") ||
    industry.includes("clinica")
  ) {
    return {
      categorySingular: "clínica dental",
      categoryPlural: "clínicas dentales",
      servicePlural: "tratamientos y servicios dentales",
      clientWord: "paciente",
      primaryAction: "Agendar cita",
      secondaryAction: "Ver tratamientos",
    }
  }

  if (
    industry.includes("restaurant") ||
    industry.includes("restaurante") ||
    industry.includes("comida")
  ) {
    return {
      categorySingular: "restaurante",
      categoryPlural: "restaurantes",
      servicePlural: "especialidades y experiencias",
      clientWord: "comensal",
      primaryAction: "Reservar mesa",
      secondaryAction: "Ver menú",
    }
  }

  if (
    industry.includes("agencia") ||
    industry.includes("marketing")
  ) {
    return {
      categorySingular: "agencia",
      categoryPlural: "agencias",
      servicePlural: "servicios y soluciones",
      clientWord: "cliente",
      primaryAction: "Solicitar propuesta",
      secondaryAction: "Ver servicios",
    }
  }

  if (
    industry.includes("tienda") ||
    industry.includes("ecommerce") ||
    industry.includes("producto")
  ) {
    return {
      categorySingular: "tienda",
      categoryPlural: "tiendas",
      servicePlural: "productos",
      clientWord: "cliente",
      primaryAction: "Ver productos",
      secondaryAction: "Conocer la marca",
    }
  }

  return {
    categorySingular:
      context.industry?.trim() || "negocio",
    categoryPlural:
      context.industry?.trim() || "negocios",
    servicePlural: "servicios",
    clientWord: "cliente",
    primaryAction: "Contactar",
    secondaryAction: "Conocer más",
  }
}
