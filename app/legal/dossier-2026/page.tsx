import type { Metadata } from "next"
import Link from "next/link"
import { Download, FileText, Scale, ShieldCheck } from "lucide-react"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import {
  formatUsd,
  officialAddons2026,
  officialBuyout2026,
  officialCompanyIntro,
  officialContractClauses2026,
  officialDocument2026,
  officialFinancialAppendix2026,
  officialGeneralTerms2026,
  officialPlanComparison2026,
  officialPlans2026,
  officialSla2026,
  officialUpdatePolicy2026,
} from "@/lib/orvenix-official-2026"

export const metadata: Metadata = {
  title: "Dossier Corporativo 2026 — Orvenix",
  description: "Marco comercial, tecnico, operativo y contractual oficial de Orvenix para servicios digitales 2026.",
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed text-orvenix-secondary">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function LegalCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-orvenix-text">{title}</h2>
      {children}
    </article>
  )
}

export default function Dossier2026Page() {
  return (
    <MarketingLayout>
      <section className="mk-hero bg-orvenix-bg">
        <div className="mk-hero-glow mk-hero-glow-1" aria-hidden="true" />
        <div className="mk-hero-glow mk-hero-glow-2" aria-hidden="true" />
        <div className="mk-container relative z-10">
          <div className="max-w-3xl">
            <p className="mk-section-tag mb-4">Documento oficial {officialDocument2026.year}</p>
            <h1 className="mk-hero-title mb-5 text-orvenix-text">{officialDocument2026.title}</h1>
            <p className="max-w-2xl text-base leading-relaxed text-orvenix-secondary">
              {officialDocument2026.subtitle}. Ambito: {officialDocument2026.scope}. Version {officialDocument2026.version}.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={officialDocument2026.pdfPath} className="mk-btn-primary inline-flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                <Download size={16} /> Descargar PDF
              </Link>
              <Link href="/precios#planes" className="mk-btn-outline inline-flex items-center gap-2">
                <FileText size={16} /> Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container grid gap-5 md:grid-cols-3">
          <LegalCard title="Que es Orvenix"><BulletList items={officialCompanyIntro.whatIs} /></LegalCard>
          <LegalCard title="Como funciona"><BulletList items={officialCompanyIntro.howItWorks} /></LegalCard>
          <LegalCard title="Que incluye"><BulletList items={officialCompanyIntro.included} /></LegalCard>
        </div>
      </section>

      <section className="mk-section bg-orvenix-bg" id="planes-oficiales">
        <div className="mk-container">
          <div className="mb-10 max-w-2xl">
            <p className="mk-section-tag mb-3">Planes oficiales</p>
            <h2 className="text-3xl font-black text-orvenix-text">Catalogo comercial 2026 en USD + IVA</h2>
            <p className="mt-3 text-sm leading-relaxed text-orvenix-secondary">
              En Mexico, los cargos pueden convertirse a MXN usando el tipo de cambio vigente de Banco de Mexico en la fecha de cobro o factura.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {officialPlans2026.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-orvenix-text">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-orvenix-secondary">{plan.audience}</p>
                  </div>
                  {"featured" in plan && plan.featured && plan.featured && <span className="rounded-full bg-[color:var(--accent)] px-2 py-1 text-[10px] font-black text-orvenix-bg">POPULAR</span>}
                </div>
                <p className="text-3xl font-black text-orvenix-text">{formatUsd(plan.monthlyUsd)}</p>
                <p className="mt-1 text-xs text-orvenix-secondary">{plan.monthlyTotalUsd ? formatUsd(plan.monthlyTotalUsd) + " con IVA / mes" : "Segun alcance"}</p>
                {plan.annualUsd && <p className="mt-2 text-xs text-orvenix-secondary">Anual: {formatUsd(plan.annualTotalUsd)} con IVA</p>}
                <div className="mt-5"><BulletList items={plan.features.slice(0, 6)} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container">
          <h2 className="mb-8 text-3xl font-black text-orvenix-text">Comparativa analitica</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="mk-cmp-table min-w-[780px]" aria-label="Comparativa oficial de planes Orvenix 2026">
              <thead>
                <tr><th>Caracteristica</th><th>Starter</th><th>Pro</th><th>Business</th><th>Enterprise</th></tr>
              </thead>
              <tbody>
                {officialPlanComparison2026.map(([feature, starter, pro, business, enterprise]) => (
                  <tr key={feature}><td>{feature}</td><td>{starter}</td><td className="highlight">{pro}</td><td>{business}</td><td>{enterprise}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mk-section bg-orvenix-bg">
        <div className="mk-container grid gap-5 lg:grid-cols-2">
          <LegalCard title="Add-ons y servicios adicionales">
            <div className="space-y-3">
              {officialAddons2026.map((addon) => (
                <div key={addon.name} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-orvenix-text">{addon.name}</h3><span className="text-sm font-black mk-accent-text">{addon.price}</span></div>
                  <p className="mt-1 text-xs text-orvenix-secondary">{addon.cadence} · {addon.applies}</p>
                </div>
              ))}
            </div>
          </LegalCard>
          <LegalCard title="Condiciones generales">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-orvenix-text">Pagos y facturacion</h3><BulletList items={officialGeneralTerms2026.billing} />
            <h3 className="mb-2 mt-6 text-sm font-black uppercase tracking-wide text-orvenix-text">Renovaciones y suspension</h3><BulletList items={officialGeneralTerms2026.renewals} />
            <h3 className="mb-2 mt-6 text-sm font-black uppercase tracking-wide text-orvenix-text">Reembolsos</h3><BulletList items={officialGeneralTerms2026.refunds} />
          </LegalCard>
        </div>
      </section>

      <section className="mk-section-alt">
        <div className="mk-container grid gap-5 lg:grid-cols-3">
          <LegalCard title="Compra definitiva"><BulletList items={[...officialBuyout2026.rights, ...officialBuyout2026.postSale]} /></LegalCard>
          <LegalCard title="SLA y backups"><BulletList items={[officialSla2026.uptime, "Ventana de mantenimiento: " + officialSla2026.maintenanceWindow, ...officialSla2026.backups]} /></LegalCard>
          <LegalCard title="Actualizaciones"><BulletList items={[...officialUpdatePolicy2026.included, ...officialUpdatePolicy2026.requiredUpgrades]} /></LegalCard>
        </div>
      </section>

      <section className="mk-section bg-orvenix-bg">
        <div className="mk-container grid gap-5 lg:grid-cols-2">
          <LegalCard title="Contrato marco">
            <div className="space-y-4">{officialContractClauses2026.map((clause) => (<div key={clause.title}><h3 className="text-sm font-black text-orvenix-text">{clause.title}</h3><p className="mt-1 text-sm leading-relaxed text-orvenix-secondary">{clause.body}</p></div>))}</div>
            <Link href="/legal/contrato" className="mt-6 inline-flex items-center gap-2 text-sm font-bold mk-accent-text hover:underline"><Scale size={15} /> Ver contrato resumido</Link>
          </LegalCard>
          <LegalCard title="Anexo financiero">
            <div className="space-y-3">{officialFinancialAppendix2026.map((item) => (<div key={item.concept} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-sm"><span className="text-orvenix-secondary">{item.concept}</span><strong className="text-orvenix-text">{item.amount}</strong></div>))}</div>
            <Link href="/legal/sla" className="mt-6 inline-flex items-center gap-2 text-sm font-bold mk-accent-text hover:underline"><ShieldCheck size={15} /> Ver SLA operativo</Link>
          </LegalCard>
        </div>
      </section>
    </MarketingLayout>
  )
}
