import { notFound, redirect } from "next/navigation"
import { z } from "zod"
import { buildFunnelStepRedirectPath } from "@/lib/commerce/funnel-runtime"

const StepSchema = z.enum(["landing", "checkout", "upsell", "downsell", "thankyou"])

interface Props {
  params: Promise<{ id: string; funnelId: string; step: string }>
}

export const dynamic = "force-dynamic"

export default async function PublicFunnelStepPage({ params }: Props) {
  const { id, funnelId, step } = await params
  const parsedStep = StepSchema.safeParse(step)
  if (!parsedStep.success) notFound()

  const target = await buildFunnelStepRedirectPath({
    siteId: id,
    funnelId,
    targetStep: parsedStep.data,
    fallbackPath: `/p/${encodeURIComponent(id)}`,
    searchParams: {
      funnelId,
      funnelStep: parsedStep.data,
    },
  })

  redirect(target)
}
