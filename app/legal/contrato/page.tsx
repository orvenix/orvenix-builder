import type { Metadata } from "next"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { officialContractClauses2026, officialDocument2026, officialGeneralTerms2026 } from "@/lib/orvenix-official-2026"

export const metadata: Metadata = {
  title: "Contrato Marco 2026 — Orvenix",
  description: "Resumen publico del contrato de prestacion de servicios tecnologicos y digitales Orvenix.",
}

export default function ContratoPage() {
  return (
    <MarketingLayout>
      <section className="mk-hero"><div className="mk-container relative z-10"><p className="mk-section-tag mb-4">Contrato marco</p><h1 className="mk-hero-title">Prestacion de servicios tecnologicos y digitales</h1><p className="mk-section-desc mt-4 max-w-2xl">Base contractual de {officialDocument2026.owner}, aplicable a servicios digitales, hosting, software, IA y soporte conforme al plan contratado.</p></div></section>
      <section className="mk-section"><div className="mk-container max-w-4xl space-y-5">
        {officialContractClauses2026.map((clause) => <article key={clause.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-xl font-black text-orvenix-text">{clause.title}</h2><p className="mt-3 text-sm leading-relaxed text-orvenix-secondary">{clause.body}</p></article>)}
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="text-xl font-black text-orvenix-text">Condiciones comerciales vinculadas</h2><div className="mt-4 grid gap-5 md:grid-cols-3"><div><h3 className="mb-2 text-sm font-bold text-orvenix-text">Facturacion</h3>{officialGeneralTerms2026.billing.map((item) => <p key={item} className="mb-2 text-xs leading-relaxed text-orvenix-secondary">{item}</p>)}</div><div><h3 className="mb-2 text-sm font-bold text-orvenix-text">Renovacion</h3>{officialGeneralTerms2026.renewals.map((item) => <p key={item} className="mb-2 text-xs leading-relaxed text-orvenix-secondary">{item}</p>)}</div><div><h3 className="mb-2 text-sm font-bold text-orvenix-text">Reembolsos</h3>{officialGeneralTerms2026.refunds.map((item) => <p key={item} className="mb-2 text-xs leading-relaxed text-orvenix-secondary">{item}</p>)}</div></div></article>
        <Link href="/legal/dossier-2026" className="inline-flex text-sm font-bold mk-accent-text hover:underline">Volver al dossier oficial</Link>
      </div></section>
    </MarketingLayout>
  )
}
