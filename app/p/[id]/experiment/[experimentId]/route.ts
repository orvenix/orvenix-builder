import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getExperiment } from "@/lib/commerce/experiments"
import { trackExperimentEvent } from "@/lib/commerce/experiment-analytics"
import { getExperimentTargetPath } from "@/lib/commerce/experiment-runtime"

interface Ctx {
  params: Promise<{ id: string; experimentId: string }>
}

export const dynamic = "force-dynamic"

function getExperimentCookieName(siteId: string, experimentId: string) {
  return `ovx_exp_${siteId}_${experimentId}`.replace(/[^a-zA-Z0-9_]/g, "_")
}

function normalizeVariant(value: string | undefined) {
  return value === "A" || value === "B" ? value : null
}

export async function GET(_request: Request, { params }: Ctx) {
  const { id, experimentId } = await params
  const experiment = await getExperiment(id, experimentId)
  if (!experiment || experiment.status !== "active") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  const cookieStore = await cookies()
  const cookieName = getExperimentCookieName(id, experimentId)
  const existingVariant = normalizeVariant(cookieStore.get(cookieName)?.value)
  const splitA = Math.max(1, Math.min(99, Number((experiment.trafficSplit as { a?: unknown })?.a) || 50))
  const variant = existingVariant ?? (Math.random() * 100 < splitA ? "A" : "B")
  const target = (await getExperimentTargetPath(id, experimentId, variant)) ?? `/p/${encodeURIComponent(id)}`
  const url = new URL(target, "http://orvenix.local")
  url.searchParams.set("experimentId", experimentId)
  url.searchParams.set("experimentVariant", variant)

  const response = NextResponse.redirect(`${url.pathname}${url.search}`)
  if (!existingVariant) {
    response.cookies.set(cookieName, variant, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    trackExperimentEvent({
      siteId: id,
      experimentId,
      variant,
      eventType: "assignment",
    }).catch(() => {})
  }

  return response
}
