import type { Metadata } from "next"
import Link from "next/link"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { officialSla2026 } from "@/lib/orvenix-official-2026"

export const metadata: Metadata = {
  title: "SLA Operativo 2026 — Orvenix",
  description: "Niveles de servicio, tiempos de respuesta, disponibilidad y backups oficiales de Orvenix.",
}

export default function SlaPage() {
  return (
    <MarketingLayout>
      <section className="mk-hero"><div className="mk-container relative z-10"><p className="mk-section-tag mb-4">Legal</p><h1 className="mk-hero-title">SLA Operativo 2026</h1><p className="mk-section-desc mt-4 max-w-2xl">{officialSla2026.uptime}</p></div></section>
      <section className="mk-section"><div className="mk-container max-w-4xl">
        <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="mk-cmp-table min-w-[720px]"><thead><tr><th>Severidad</th><th>Ejemplos</th><th>Respuesta</th><th>Resolucion objetivo</th></tr></thead><tbody>{officialSla2026.severities.map((item) => <tr key={item.level}><td className="font-bold text-orvenix-text">{item.level}</td><td>{item.examples}</td><td>{item.response}</td><td>{item.resolution}</td></tr>)}</tbody></table></div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><h2 className="mb-4 text-xl font-black text-orvenix-text">Backups y seguridad</h2><ul className="space-y-2">{officialSla2026.backups.map((item) => <li key={item} className="text-sm text-orvenix-secondary">• {item}</li>)}</ul><p className="mt-5 text-sm text-orvenix-secondary">Ventana de mantenimiento: {officialSla2026.maintenanceWindow}.</p></div>
        <Link href="/legal/dossier-2026" className="mt-8 inline-flex text-sm font-bold mk-accent-text hover:underline">Volver al dossier oficial</Link>
      </div></section>
    </MarketingLayout>
  )
}
