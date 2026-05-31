import { redirect } from "next/navigation"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId") ?? ""
  const action = searchParams.get("action") ?? "buy"

  redirect(`/dashboard?checkout=pending&intent=${action}&siteId=${encodeURIComponent(siteId)}`)
}
