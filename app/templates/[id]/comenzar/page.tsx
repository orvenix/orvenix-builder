import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getAuthSession } from "@/lib/auth-session"
import { getCommercialTemplateStart } from "@/lib/commercial/template-start"
import { getCommercialDesignV1 } from "@/lib/orvenix-ai/commercial-designs/registry"
import { requireCanCreateWebsite } from "@/lib/plan-guard"
import { getRealTemplate } from "@/lib/realTemplates"

import { CommercialStartForm } from "./CommercialStartForm"

/**
 * CV1-1: "Usar este diseño" for catalog templates backed by a commercial
 * design. The customer types their own business facts; creation itself is
 * the existing createSiteFromCommercialDesignAction (preview + confirm).
 */
export const metadata: Metadata = {
  title: "Personaliza tu sitio",
  robots: { index: false, follow: false },
}

export default async function CommercialTemplateStartPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = getRealTemplate(id)
  const start = getCommercialTemplateStart(template)
  const design = start ? getCommercialDesignV1(start.designId, start.version) : null
  if (!template || !start || !design) notFound()

  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(start.href)}`)
  }

  try {
    await requireCanCreateWebsite(session.user.id)
  } catch {
    redirect(`/precios?upgrade=websites&callbackUrl=${encodeURIComponent(start.href)}`)
  }

  return (
    <CommercialStartForm
      designId={start.designId}
      version={start.version}
      templateName={template.name}
      summary={design.catalog.summary}
      accent={template.accent}
      demoHref={`/templates/${encodeURIComponent(template.id)}/demo`}
      backHref={`/templates/${encodeURIComponent(template.id)}`}
    />
  )
}
