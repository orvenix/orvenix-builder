import type {
  OrvenixAIContext,
  OrvenixAIIntent,
} from "./types";

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function detectIntent(
  context: OrvenixAIContext
): OrvenixAIIntent {
  const text = context.request.toLowerCase().trim();

  if (
    includesAny(text, [
      "crea un sitio",
      "crear un sitio",
      "hazme un sitio",
      "haz un sitio",
      "crea una web",
      "crear una web",
      "hazme una pagina",
      "hazme una página",
    ])
  ) {
    return "create_site";
  }

  if (
    includesAny(text, [
      "rediseña",
      "rediseñar",
      "rediseña mi",
      "cambia todo el diseño",
    ])
  ) {
    return "redesign_site";
  }

  if (
    includesAny(text, [
      "hazlo mejor",
      "mejora el sitio",
      "mejora mi sitio",
      "mejora esta pagina",
      "mejora esta página",
      "hazlo profesional",
      "hazlo premium",
    ])
  ) {
    return "improve_site";
  }

  if (
    includesAny(text, [
      "seo",
      "google",
      "posicionamiento",
      "meta description",
      "metadescription",
    ])
  ) {
    return "improve_seo";
  }

  if (
    includesAny(text, [
      "conversion",
      "conversión",
      "vender mas",
      "vender más",
      "mas ventas",
      "más ventas",
      "cta",
    ])
  ) {
    return "improve_conversion";
  }

  if (
    includesAny(text, [
      "responsive",
      "movil",
      "móvil",
      "tablet",
      "celular",
    ])
  ) {
    return "improve_responsive";
  }

  if (
    includesAny(text, [
      "agrega una seccion",
      "agrega una sección",
      "añade una seccion",
      "añade una sección",
    ])
  ) {
    return "add_section";
  }

  if (
    includesAny(text, [
      "elimina la seccion",
      "elimina la sección",
      "borra la seccion",
      "borra la sección",
    ])
  ) {
    return "remove_section";
  }

  if (
    includesAny(text, [
      "texto",
      "copy",
      "titulo",
      "título",
      "descripcion",
      "descripción",
    ])
  ) {
    return "edit_content";
  }

  if (
    includesAny(text, [
      "color",
      "tipografia",
      "tipografía",
      "diseño",
      "diseño visual",
      "espaciado",
    ])
  ) {
    return "edit_design";
  }

  if (
    includesAny(text, [
      "analiza",
      "revisa",
      "audita",
      "que mejorarias",
      "qué mejorarías",
    ])
  ) {
    return "analyze_site";
  }

  return "unknown";
}
