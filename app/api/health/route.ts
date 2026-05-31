import { NextResponse } from "next/server";
import { getRuntimeHealth } from "@/lib/runtime-health";

export const runtime = "nodejs";

export async function GET() {
  const report = await getRuntimeHealth();
  return NextResponse.json(report, {
    status: report.status === "down" ? 503 : 200,
  });
}

