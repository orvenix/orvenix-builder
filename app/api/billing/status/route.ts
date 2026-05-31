import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { buildBillingStatusResponse } from "@/lib/billing/route-logic"
import { editorPrisma } from "@/lib/editor-db"

// GET /api/billing/status — estado de suscripción del usuario actual
export async function GET() {
  const result = await buildBillingStatusResponse({
    session: await getAuthSession(),
    findSubscription: (userId) =>
      editorPrisma.subscription.findUnique({
        where: { userId },
        include: { plan: true },
      }),
    countWebsites: (userId) =>
      editorPrisma.editorWebsite.count({
        where: { userId },
      }),
  })

  return NextResponse.json(result.body, { status: result.status })
}
