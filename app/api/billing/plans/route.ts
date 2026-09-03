import { NextResponse } from "next/server"
import { editorPrisma } from "@/lib/editor-db"
import { getOfficialPlanName } from "@/lib/orvenix-official-2026"

// GET /api/billing/plans — lista pública de planes activos
export async function GET() {
  const plans = await editorPrisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthMxn: "asc" },
  })
  return NextResponse.json({
    plans: plans.map((plan) => ({
      ...plan,
      name: getOfficialPlanName(plan.id, plan.name),
    })),
  })
}
