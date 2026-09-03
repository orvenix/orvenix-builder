import { readFileSync, writeFileSync } from "node:fs"

const SOURCE_FILE = "docs/chatbot-knowledge.seed.json"
const OUTPUT_FILE = "docs/chatbot-knowledge.md"
const BLOCKED = [/SECRET/i, /TOKEN/i, /API_KEY/i, /PASSWORD/i, /DATABASE_URL/i, /sk_live_/i, /sk_test_/i, /whsec_/i, /NEXTAUTH/i]

function assertSafe(value, path = "root") {
  if (typeof value === "string") {
    for (const pattern of BLOCKED) {
      if (pattern.test(value)) throw new Error(`Contenido sensible bloqueado en ${path}`)
    }
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafe(item, `[object Object][${index}]`))
    return
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertSafe(item, `[object Object].${key}`)
  }
}

function list(items) {
  return items.map((item) => `- ${item}`).join("\n")
}

function planBlock(plan) {
  return [
    `### ${plan.name}`,
    `ID: ${plan.id}`,
    `Precio: ${plan.price}`,
    plan.audience,
    `CTA: ${plan.cta}`,
    "Incluye:",
    list(plan.includes),
  ].join("\n")
}

function pageTypeBlock(pageType) {
  return [
    `### ${pageType.name}`,
    pageType.useCase,
    "Secciones recomendadas:",
    list(pageType.recommendedSections),
    `Consejo: ${pageType.advice}`,
  ].join("\n")
}

const data = JSON.parse(readFileSync(SOURCE_FILE, "utf8"))
assertSafe(data)

const output = `# Base de conocimiento — Orvenix AI
# Archivo generado automaticamente por npm run chatbot:refresh.
# Ultima actualizacion: ${new Date().toISOString()}
# Fuente: docs/chatbot-knowledge.seed.json. No incluir secretos, datos de usuarios ni detalles internos.

## Principios de respuesta

${list(data.principles)}

## Que es Orvenix

${list(data.positioning)}

## Contacto oficial

- Correo: ${data.contact.email}
- WhatsApp: ${data.contact.whatsapp}
- Contacto: ${data.contact.contactPath}
- Precios: ${data.contact.pricingPath}

## Planes oficiales

${data.plans.map(planBlock).join("\n\n")}

## Super Builder y editor

${list(data.builder)}

## Templates por industria

${list(data.templates)}

## Tipos de paginas web que puede recomendar

${(data.pageTypes ?? []).map(pageTypeBlock).join("\n\n")}

## Guia rapida por industria

${list(data.industryGuides ?? [])}

## Playbook de secciones web

${list(data.sectionPlaybook ?? [])}

## Criterios de diseno y conversion

${list(data.designGuidance ?? [])}

## Comportamiento recomendado del bot

${list(data.botBehavior ?? [])}

## Reglas de recomendacion comercial

${list(data.conversion)}

## Politica de dudas no cubiertas

Si el usuario pregunta algo que no este cubierto por esta base, responder que el equipo puede confirmarlo en /contacto/. No improvisar informacion.
`

writeFileSync(OUTPUT_FILE, output)
console.log(`Chatbot knowledge actualizado: ${OUTPUT_FILE}`)
console.log(`Caracteres: ${output.length}`)
