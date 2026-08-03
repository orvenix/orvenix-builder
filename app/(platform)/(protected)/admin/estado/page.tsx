import { redirect } from "next/navigation"
import { getAuthSession } from "@/lib/auth-session"
import { editorPrisma } from "@/lib/editor-db"

export const metadata = { title: "Estado del Sistema · Orvenix Admin" }

export default async function AdminEstadoPage() {
  const session = await getAuthSession()

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/estado")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  let dbOk = true
  let totalUsers = 0
  let totalSites = 0
  let publishedSites = 0
  let activeSubscriptions = 0
  let lastWebhook = null as null | { eventType: string; status: string; createdAt: Date }

  try {
    totalUsers = await editorPrisma.user.count()
    totalSites = await editorPrisma.editorWebsite.count()
    publishedSites = await editorPrisma.editorWebsite.count({ where: { published: true } })
    activeSubscriptions = await editorPrisma.subscription.count({ where: { status: "active" } })

    lastWebhook = await editorPrisma.webhookEvent.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        eventType: true,
        status: true,
        createdAt: true,
      },
    })
  } catch {
    dbOk = false
  }

  const stripeOk =
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET)

  const resendOk =
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.RESEND_FROM)

  const appUrl = process.env.NEXTAUTH_URL ?? "Sin configurar"

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">
            Orvenix BackOffice
          </p>
          <h1 className="text-4xl font-black mt-2">Estado del Sistema</h1>
          <p className="text-slate-400 mt-2">
            Revisión rápida de servicios críticos antes del lanzamiento público.
          </p>
        </header>

        <section className="grid md:grid-cols-4 gap-4">
          <StatusCard title="Aplicación" ok detail={appUrl} />
          <StatusCard title="Base de datos" ok={dbOk} detail={dbOk ? "MariaDB conectada" : "Error de conexión"} />
          <StatusCard title="Stripe" ok={stripeOk} detail={stripeOk ? "Configurado" : "Faltan variables"} />
          <StatusCard title="Resend" ok={resendOk} detail={resendOk ? "Configurado" : "Faltan variables"} />
        </section>

        <section className="grid md:grid-cols-4 gap-4">
          <Metric title="Clientes" value={totalUsers} />
          <Metric title="Suscripciones activas" value={activeSubscriptions} />
          <Metric title="Sitios totales" value={totalSites} />
          <Metric title="Sitios publicados" value={publishedSites} />
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Último webhook</h2>
          {lastWebhook ? (
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <Info label="Evento" value={lastWebhook.eventType} />
              <Info label="Estado" value={lastWebhook.status} />
              <Info label="Fecha" value={lastWebhook.createdAt.toLocaleString("es-MX")} />
            </div>
          ) : (
            <p className="text-slate-400">Todavía no hay webhooks registrados.</p>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4">Checklist de lanzamiento</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <ChecklistItem ok={dbOk} text="Base de datos responde correctamente" />
            <ChecklistItem ok={stripeOk} text="Stripe configurado" />
            <ChecklistItem ok={resendOk} text="Resend configurado" />
            <ChecklistItem ok={publishedSites > 0} text="Existe al menos un sitio publicado" />
            <ChecklistItem ok={activeSubscriptions > 0} text="Existe al menos una suscripción activa" />
            <ChecklistItem ok={Boolean(lastWebhook)} text="Webhook registrado en la base de datos" />
          </div>
        </section>
      </div>
    </main>
  )
}

function StatusCard({
  title,
  ok,
  detail,
}: {
  title: string
  ok: boolean
  detail: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className={`text-2xl font-black mt-2 ${ok ? "text-emerald-300" : "text-red-300"}`}>
        {ok ? "Activo" : "Revisar"}
      </p>
      <p className="text-xs text-slate-500 mt-2 break-all">{detail}</p>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  )
}

function ChecklistItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-900/80 border border-white/10 p-4">
      <span className={ok ? "text-emerald-300" : "text-red-300"}>
        {ok ? "●" : "●"}
      </span>
      <span className="text-sm">{text}</span>
    </div>
  )
}
