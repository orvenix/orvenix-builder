import Link from "next/link"
import type { PublicCheckoutStatusNotice } from "@/lib/commerce/funnel-checkout-status"

const TONE_STYLES: Record<PublicCheckoutStatusNotice["tone"], string> = {
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-50",
  amber: "border-amber-400/25 bg-amber-500/10 text-amber-50",
  red: "border-red-400/25 bg-red-500/10 text-red-50",
}

export function FunnelCheckoutStatusNotice({ notice }: { notice: PublicCheckoutStatusNotice }) {
  return (
    <section className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-5xl rounded-3xl border px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur ${TONE_STYLES[notice.tone]}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {notice.eyebrow}
        </p>
        <h2 className="mt-2 text-lg font-semibold sm:text-xl">{notice.title}</h2>
        <p className="mt-1 text-sm opacity-90">{notice.description}</p>
        {notice.detail && (
          <p className="mt-2 text-xs opacity-80">{notice.detail}</p>
        )}
        {(notice.ctaHref || notice.secondaryHref) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
            {notice.ctaHref && notice.ctaLabel && (
              <Link
                href={notice.ctaHref}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 transition-opacity hover:opacity-90"
              >
                {notice.ctaLabel}
              </Link>
            )}
            {notice.secondaryHref && notice.secondaryLabel && (
              <Link
                href={notice.secondaryHref}
                className="rounded-full border border-white/10 px-3 py-1.5 opacity-80 transition-opacity hover:opacity-100"
              >
                {notice.secondaryLabel}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
