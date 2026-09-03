import type {
  MutationScope,
} from "./types"

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

function includesAny(
  text: string,
  values: string[],
) {
  const normalizedText =
    normalize(text)

  return values.some(
    (value) =>
      normalizedText.includes(
        normalize(value),
      ),
  )
}

export function detectMutationScope(
  request: string,
): MutationScope {
  const text =
    normalize(request)

  if (
    includesAny(text, [
      "publica",
      "publicar",
      "ponlo en linea",
      "ponlo online",
      "hazlo publico",
    ])
  ) {
    return "publish"
  }

  if (
    includesAny(text, [
      "crea un sitio",
      "crear un sitio",
      "hazme un sitio",
      "haz un sitio",
      "nuevo sitio",
      "crea una web",
      "crear una web",
      "hazme una web",
      "genera un sitio",
      "generar un sitio",
      "sitio desde cero",
      "web desde cero",
    ])
  ) {
    return "site_creation"
  }

  if (
    includesAny(text, [
      "transforma todo el sitio",
      "rediseña todo el sitio",
      "convierte este sitio",
      "rehaz todo el sitio",
      "reemplaza todo el sitio",
    ])
  ) {
    return "site_redesign"
  }

  if (
    includesAny(text, [
      "rediseña esta pagina",
      "rediseña la pagina",
      "rehaz esta pagina",
      "mejora toda esta pagina",
      "transforma esta pagina",
    ])
  ) {
    return "page_redesign"
  }

  if (
    includesAny(text, [
      "agrega una seccion",
      "agregar una seccion",
      "añade una seccion",
      "crea una seccion",
      "crear una seccion",
      "genera una seccion",
      "generar una seccion",
      "diseña una seccion",
      "diseñar una seccion",
      "haz una seccion",
      "hazme una seccion",
      "crea un bloque",
      "genera un bloque",
      "diseña un bloque",
      "elimina esta seccion",
      "borra esta seccion",
      "rehaz servicios",
      "rehaz esta seccion",
      "mejora esta seccion",
      "agrega faq",
      "agrega testimonios",
      "agrega galeria",
    ])
  ) {
    return "section_edit"
  }

  /*
 * DESIGN EDIT
 *
 * Rediseño visual coordinado sin cambiar
 * la estructura de la página.
 */
if (
  includesAny(text, [
    "premium",
    "lujoso",
    "lujosa",
    "de lujo",

    "minimalista",
    "minimal",

    "moderno",
    "moderna",
    "moderniza",

    "elegante",
    "sofisticado",
    "sofisticada",

    "mas compacto",
    "mas compacta",
    "menos espacio",
    "menos espaciado",

    "mas espacioso",
    "mas espaciosa",
    "mas espacio",
    "mas espaciado",
  ])
) {
  return "design_edit"
}

  /*
 * THEME EDIT
 *
 * Debe evaluarse antes de LOCAL EDIT porque
 * frases como "cambia el color principal"
 * también contienen "cambia el color".
 */
if (
  includesAny(text, [
    "color principal",
    "color secundario",
    "color de fondo",
    "color del fondo",
    "color de texto",
    "color del texto",
    "color de acento",

    "tipografia de titulos",
    "fuente de titulos",
    "tipografia del cuerpo",
    "fuente del cuerpo",

    "espaciado vertical global",
    "espaciado horizontal global",
    "espaciado entre elementos",

    "radio de las tarjetas",
    "radio de tarjetas",
    "radio de los botones",
    "radio de botones",
  ])
) {
  return "theme_edit"
}

  /*
 * MULTI EDIT
 *
 * Modificación de varios nodos existentes
 * sin alterar la estructura del árbol.
 */
if (
  includesAny(text, [
    "todos los botones",
    "todos los cta",
    "todos los titulos",
    "todos los headings",
    "todos los textos",
    "todas las secciones",
  ])
) {
  return "multi_edit"
}

  if (
    includesAny(text, [
      "cambia el titulo",
      "cambia el texto",
      "cambia el color",
      "cambia el boton",
      "cambia la imagen",
      "haz el hero",
      "mejora el hero",
      "modifica el hero",
      "cambia este bloque",
      "modifica este bloque",
    ])
  ) {
    return "local_edit"
  }

  if (
    includesAny(text, [
      "analiza",
      "revisa",
      "audita",
      "que mejorarias",
      "que cambiarias",
      "dame recomendaciones",
    ])
  ) {
    return "read_only"
  }

  if (
  includesAny(text, [
    "color principal",
    "color secundario",
    "color de fondo",
    "color del fondo",
    "color de texto",
    "color del texto",
    "color de acento",
    "tipografia de titulos",
    "fuente de titulos",
    "tipografia del cuerpo",
    "fuente del cuerpo",
    "espaciado vertical global",
    "espaciado horizontal global",
    "espaciado entre elementos",
    "radio de las tarjetas",
    "radio de tarjetas",
    "radio de los botones",
    "radio de botones",
  ])
) {
  return "theme_edit"
}

  /*
 * SECTION STRUCTURAL EDIT
 *
 * Detecta operaciones que agregan, eliminan,
 * reemplazan o reconstruyen una sección.
 */
const sectionOperations = [
  "agrega",
  "agregar",
  "anade",
  "anadir",
  "inserta",
  "insertar",
  "crea",
  "crear",
  "pon",
  "poner",
  "elimina",
  "eliminar",
  "borra",
  "borrar",
  "quita",
  "quitar",
  "rehaz",
  "reemplaza",
  "reemplazar",
]

const sectionTargets = [
  "faq",
  "preguntas frecuentes",
  "servicios",
  "galeria",
  "testimonios",
  "contacto",
  "proceso",
  "hero",
  "portada",
  "inicio",
  "precios",
  "planes",
  "paquetes",
  "cta",
  "productos",
  "catalogo",
  "caracteristicas",
  "beneficios",
  "confianza",
  "prueba social",
]

const hasSectionOperation =
  includesAny(
    text,
    sectionOperations,
  )

const hasSectionTarget =
  includesAny(
    text,
    sectionTargets,
  )

if (
  hasSectionOperation &&
  hasSectionTarget
) {
  return "section_edit"
}

  /*
   * En caso ambiguo elegimos el
   * permiso más conservador.
   */
  return "read_only"
}
