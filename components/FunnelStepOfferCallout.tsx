import Link from "next/link"
import type { PublicFunnelOfferCallout } from "@/lib/commerce/funnel-offer-public"

const TONE_STYLES: Record<PublicFunnelOfferCallout["tone"], string> = {
  cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-50",
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-50",
  amber: "border-amber-400/25 bg-amber-500/10 text-amber-50",
}

export function FunnelStepOfferCallout({ offer }: { offer: PublicFunnelOfferCallout }) {
  return (
    <section className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className={`mx-auto max-w-5xl rounded-3xl border px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)] backdrop-blur ${TONE_STYLES[offer.tone]}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {offer.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold sm:text-xl">{offer.title}</h2>
            <p className="mt-1 text-sm opacity-90">{offer.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {offer.ctaHref ? (
              <Link
                href={offer.ctaHref}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 transition-opacity hover:opacity-90"
              >
                {offer.ctaLabel}
              </Link>
            ) : (
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                {offer.acceptLabel}
              </span>
            )}
            {(offer.secondaryHref || offer.declineLabel) && (
              offer.secondaryHref ? (
                <Link
                  href={offer.secondaryHref}
                  className="rounded-full border border-white/10 px-3 py-1.5 opacity-80 transition-opacity hover:opacity-100"
                >
                  {offer.secondaryLabel}
                </Link>
              ) : (
                <span className="rounded-full border border-white/10 px-3 py-1.5 opacity-80">
                  {offer.declineLabel}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
