import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getAuthSession } from "@/lib/auth-session"
import { getReceiptData } from "@/lib/receipts"
import { PrintButton } from "./PrintButton"
import { ArrowLeft, CheckCircle, Clock, Globe } from "lucide-react"
import type { UserRole } from "@/lib/auth"

interface Props {
  params: Promise<{ siteId: string }>
}

export default async function ReciboPage({ params }: Props) {
  const { siteId } = await params
  const session = await getAuthSession()
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")

  const receipt = await getReceiptData(siteId)
  if (!receipt) notFound()

  // Solo el propietario o admin pueden ver el recibo
  const role = (session.user.role ?? "CLIENT") as UserRole
  if (role !== "ADMIN" && receipt.client.email && receipt.client.email !== session.user.email) {
    redirect("/dashboard")
  }

  const isPaid = receipt.order.status === "paid"
  const actionLabel = receipt.order.action === "buy" ? "Compra única" : "Renta mensual"
  const statusLabel = isPaid ? "Pagado" : "Pendiente de pago"

  const fecha = receipt.createdAt.toLocaleDateString("es-MX", {
    day: "2-digit", month: "long", year: "numeric",
  })

  const priceFmt = receipt.order.priceMxn
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(receipt.order.priceMxn)
    : "Por confirmar"

  const rentaFmt = receipt.order.action === "rent" && receipt.order.priceMxn
    ? `${priceFmt} / mes`
    : priceFmt

  return (
    <>
      {/* Print CSS global solo para esta página */}
      <style>{`
        @media print {
          .receipt-no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .receipt-shell { background: #fff !important; min-height: 100vh; padding: 0 !important; }
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 12px !important;
            background: #fff !important;
            color: #111 !important;
            max-width: 680px;
            margin: 0 auto;
          }
          .receipt-header { background: #1e1b4b !important; }
          .receipt-label { color: #6b7280 !important; }
          .receipt-value { color: #111 !important; }
          .receipt-divider { border-color: #e5e7eb !important; }
          .receipt-status-pending { background: #fef3c7 !important; color: #92400e !important; border-color: #fde68a !important; }
          .receipt-status-paid { background: #d1fae5 !important; color: #065f46 !important; border-color: #6ee7b7 !important; }
          .receipt-footer { color: #9ca3af !important; border-color: #e5e7eb !important; }
          .receipt-price { color: #312e81 !important; }
        }
        @page { margin: 1.5cm; size: A4; }
      `}</style>

      <div className="receipt-shell min-h-screen bg-[#040408] text-white py-10 px-4">

        {/* Acciones (solo pantalla) */}
        <div className="receipt-no-print max-w-2xl mx-auto mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft size={15} />
            Volver al dashboard
          </Link>
          <PrintButton />
        </div>

        {/* Tarjeta del recibo */}
        <div className="receipt-card max-w-2xl mx-auto rounded-3xl border border-white/[0.08] bg-white/[0.03] overflow-hidden shadow-2xl shadow-black/40">

          {/* Header oscuro */}
          <div className="receipt-header bg-[#1e1b4b] px-8 py-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300/70 mb-1">Comprobante de pedido</p>
              <h1 className="text-2xl font-black text-white tracking-tight">Orvenix</h1>
              <p className="text-xs text-indigo-300/50 mt-1">orvenix.com.mx · hola@orvenix.com.mx</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-300/50 mb-1">Folio</p>
              <p className="font-mono text-lg font-bold text-white">{receipt.folio}</p>
              <p className="text-xs text-indigo-300/40 mt-1">{fecha}</p>
            </div>
          </div>

          <div className="px-8 py-7 space-y-7">

            {/* Estado */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold ${
              isPaid
                ? "receipt-status-paid bg-emerald-950/30 text-emerald-300 border-emerald-700/30"
                : "receipt-status-pending bg-amber-950/30 text-amber-300 border-amber-700/30"
            }`}>
              {isPaid
                ? <CheckCircle size={14} className="text-emerald-400" />
                : <Clock size={14} className="text-amber-400" />}
              {statusLabel}
            </div>

            {/* Cliente */}
            <div>
              <p className="receipt-label text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Cliente</p>
              <div className="receipt-value space-y-1">
                <p className="font-semibold text-white">{receipt.client.name}</p>
                <p className="text-sm text-white/50">{receipt.client.email}</p>
              </div>
            </div>

            {/* Separador */}
            <hr className="receipt-divider border-white/[0.06]" />

            {/* Concepto */}
            <div>
              <p className="receipt-label text-xs font-bold uppercase tracking-wider text-white/30 mb-4">Detalle del pedido</p>
              <div className="space-y-3">
                <Row label="Sitio web" value={receipt.site.name} />
                {receipt.order.templateName && (
                  <Row label="Template" value={receipt.order.templateName} />
                )}
                {receipt.order.templateCategory && (
                  <Row label="Categoría" value={receipt.order.templateCategory} />
                )}
                <Row label="Modalidad" value={actionLabel} />
                <Row label="Estado del sitio" value={receipt.site.published ? "Publicado" : "En edición"} />
              </div>
            </div>

            <hr className="receipt-divider border-white/[0.06]" />

            {/* Total */}
            <div className="flex items-end justify-between">
              <div>
                <p className="receipt-label text-xs font-bold uppercase tracking-wider text-white/30 mb-1">
                  {receipt.order.action === "rent" ? "Renta mensual" : "Precio total"}
                </p>
                <p className="receipt-price text-4xl font-black text-indigo-300">{rentaFmt}</p>
                {receipt.order.action === "rent" && (
                  <p className="text-xs text-white/25 mt-1">Renovación automática mensual</p>
                )}
              </div>
              {receipt.site.published && (
                <Link
                  href={`/p/${receipt.site.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="receipt-no-print flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Globe size={12} />
                  Ver sitio publicado
                </Link>
              )}
            </div>

            {/* Footer */}
            <div className="receipt-footer border-t border-white/[0.06] pt-6 space-y-1 text-[11px] text-white/20">
              <p>Este documento es un comprobante de pedido generado automáticamente por Orvenix.</p>
              <p>Para soporte: hola@orvenix.com.mx · Para facturación fiscal solicítala por correo indicando el folio.</p>
              <p className="font-mono mt-2 text-white/10">ID del sitio: {receipt.site.id}</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="receipt-label text-white/35">{label}</span>
      <span className="receipt-value text-white/80 font-medium">{value}</span>
    </div>
  )
}
