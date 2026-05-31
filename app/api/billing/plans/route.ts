import { NextResponse } from "next/server"
import { editorPrisma } from "@/lib/editor-db"

// GET /api/billing/plans — lista pública de planes activos
export async function GET() {
  const plans = await editorPrisma.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthMxn: "asc" },
  })
  return NextResponse.json({ plans })
}
