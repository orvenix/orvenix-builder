import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { getAffiliateByUserId, getReferralsByAffiliate } from "@/lib/affiliates"

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const affiliate = await getAffiliateByUserId(session.user.id)
  if (!affiliate) return NextResponse.json({ referrals: [] })

  const referrals = await getReferralsByAffiliate(affiliate.id)

  // Enmascarar email para privacidad: ana****@gmail.com
  const masked = referrals.map(r => ({
    ...r,
    referredEmail: maskEmail(r.referredEmail),
  }))

  return NextResponse.json({ referrals: masked })
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  if (!user || !domain) return email
  const visible = user.slice(0, 3)
  return `${visible}${"*".repeat(Math.max(2, user.length - 3))}@${domain}`
}
