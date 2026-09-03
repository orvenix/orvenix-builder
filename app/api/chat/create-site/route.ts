import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { isEditorWebId, type EditorWebId } from "@/lib/editorWebs"
import { REAL_TEMPLATES } from "@/lib/realTemplates"
import { runIntelligentTemplateFlow } from "@/lib/intelligentTemplates"
import { createSiteFromTree } from "@/lib/auth"
import { runAutonomousSiteBuilder } from "@/lib/orvenix-ai/autonomous"
import { requireCanCreateWebsite } from "@/lib/plan-guard"
import { serverError } from "@/lib/server-log"

export const runtime = "nodejs"

type CreateSiteBody = {
  prompt?: unknown
  templateId?: unknown
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñs-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function inferIndustryFromPrompt(prompt: string) {
  const value = normalize(prompt)

  if (/(tienda|ecommerce|catalogo|ropa|producto|productos|carrito|curso|infoproducto)/.test(value)) return "ecommerce"
  if (/(restaurante|comida|menu|cafeteria|bar)/.test(value)) return "restaurante"
  if (/(clinica|medico|doctor|dentista|salud|consultorio)/.test(value)) return "salud"
  if (/(inmobiliaria|propiedad|casa|departamento|bienes raices)/.test(value)) return "inmobiliaria"
  if (/(abogado|legal|despacho|juridico)/.test(value)) return "servicios legales"
  if (/(contador|contabilidad|fiscal|sat|imss)/.test(value)) return "contabilidad"
  if (/(agencia|consultoria|consultor|b2b|marketing)/.test(value)) return "servicios profesionales"
  if (/(gimnasio|fitness|entrenador|clases)/.test(value)) return "fitness"
  if (/(hotel|habitacion|hospedaje|reserva)/.test(value)) return "hotel"
  return "negocio profesional"
}

function inferBusinessFromPrompt(prompt: string) {
  const industry = inferIndustryFromPrompt(prompt)

  return {
    name: "Nuevo sitio Orvenix",
    industry,
    description: prompt,
    audience: "Clientes potenciales",
    objective: industry === "ecommerce" ? "Vender online" : "Generar prospectos y contactos",
  }
}

function buildFreshSiteName(prompt: string) {
  const industry = inferIndustryFromPrompt(prompt)
  const cleaned = prompt.trim().replace(/\s+/g, " ").slice(0, 42)

  if (cleaned.length >= 8) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return "Sitio " + industry
}

export async function POST(request: Request) {
  const session = await getAuthSession()

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      {
        error: "Inicia sesión para crear un sitio editable con Orvenix AI.",
        code: "UNAUTHENTICATED",
        loginUrl: "/login?callbackUrl=/templates",
      },
      { status: 401 }
    )
  }

  const body = (await request.json().catch(() => null)) as CreateSiteBody | null
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida", code: "INVALID_BODY" }, { status: 400 })
  }

  const explicitTemplateId = typeof body.templateId === "string" && isEditorWebId(body.templateId)
    ? body.templateId as EditorWebId
    : null
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : ""

  if (!explicitTemplateId && !prompt) {
    return NextResponse.json(
      { error: "Describe el sitio que quieres crear desde cero.", code: "PROMPT_REQUIRED" },
      { status: 400 }
    )
  }

  try {
    await requireCanCreateWebsite(session.user.id)
  } catch {
    return NextResponse.json(
      {
        error: "Tu plan no permite crear otro sitio. Puedes subir de plan para generar más sitios.",
        code: "PLAN_LIMIT_REACHED",
        upgradeUrl: "/precios?upgrade=websites&callbackUrl=/templates",
      },
      { status: 403 }
    )
  }

  try {
    if (explicitTemplateId) {
      const result = await runIntelligentTemplateFlow({
        templateId: explicitTemplateId,
        intent: "edit",
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      })

      const template = REAL_TEMPLATES.find((item) => item.id === explicitTemplateId)

      return NextResponse.json({
        ok: true,
        mode: "template",
        templateId: explicitTemplateId,
        templateName: template?.name ?? explicitTemplateId,
        siteId: result.site.id,
        nextRoute: result.nextRoute,
      })
    }

    const generated = await runAutonomousSiteBuilder({
      request: prompt,
      business: inferBusinessFromPrompt(prompt),
      preferredStyle: "premium editable desde cero",
      forceFreshComposition: true,
      minimumQuality: 55,
    })

    const site = await createSiteFromTree({
      name: buildFreshSiteName(prompt),
      description: "created_from_scratch: orvenix_ai; prompt=" + prompt.slice(0, 180),
      userId: session.user.id,
      tree: generated.tree,
    })

    return NextResponse.json({
      ok: true,
      mode: "from_scratch",
      siteId: site.id,
      nextRoute: "/editor/" + site.id,
      quality: generated.quality.score,
      trace: generated.trace,
    })
  } catch (error) {
    serverError("[chat:create-site] No se pudo crear sitio desde template", error)
    return NextResponse.json(
      {
        error: "No pude crear el sitio en este momento. Intenta desde /templates o contacta soporte.",
        code: "CREATE_SITE_FAILED",
      },
      { status: 500 }
    )
  }
}
