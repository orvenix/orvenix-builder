import { getAuthSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSitesForRole, type UserRole } from "@/lib/auth";
import { getEditRequestsForRole, type EditRequest, type EditRequestStatus } from "@/lib/editRequests";
import { CreateSiteDialog } from "./CreateSiteDialog";
import { EditRequestDialog } from "./EditRequestDialog";
import { ExportDropdown } from "./ExportDropdown";
import { deleteSiteAction, updateEditRequestStatusAction } from "./actions";
import { DashboardNav } from "./DashboardNav";
import { DashboardBillingPanel } from "./DashboardBillingPanel";
import {
  Edit3, Globe, Trash2, ExternalLink,
  ArrowRight, Sparkles, TrendingUp, Clock, ShieldCheck,
  Activity, Layers3, LayoutTemplate, Wrench, CheckCircle2, CircleDot, XCircle, CreditCard, FileText, BarChart2,
  type LucideIcon,
} from "lucide-react";
import { normalizeCheckoutAction } from "@/lib/checkout";
import { editorPrisma } from "@/lib/editor-db";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: Promise<{
    checkout?: string | string[];
    intent?: string | string[];
    siteId?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const checkoutStatus = firstParam(resolvedSearchParams?.checkout);
  const checkoutIntent = normalizeCheckoutAction(firstParam(resolvedSearchParams?.intent));
  const checkoutSiteId = firstParam(resolvedSearchParams?.siteId);
  const role = (session.user.role ?? "CLIENT") as UserRole;
  const isAdmin = role === "ADMIN";
  const sites = await getSitesForRole(session.user.id, role);
  const editRequests = await getEditRequestsForRole(session.user.id, role);
  const subscription = await editorPrisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });
  const isActiveSubscription = subscription?.status === "active" || subscription?.status === "authorized";
  const published = sites.filter((s) => s.published).length;
  const drafts = sites.length - published;
  const openRequests = editRequests.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length;
  const userName = session.user.name ?? session.user.email ?? "Usuario";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell min-h-screen overflow-hidden text-white">

      {/* ── Glows del fondo — mismos colores cyan del sitio ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="dashboard-glow-1" />
        <div className="dashboard-glow-2" />
        <div className="dashboard-grid" />
        <div className="dashboard-top-line" />
      </div>

      {/* ── Nav ── */}
      <DashboardNav
        initials={initials}
        email={session.user.email ?? ""}
        isAdmin={isAdmin}
        role={role}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        {(checkoutStatus === "pending" || checkoutStatus === "success") && checkoutSiteId && (
          <div className={`mb-6 rounded-[24px] border p-5 shadow-xl shadow-black/15 editor-anim-fade-up ${
            checkoutStatus === "success"
              ? "border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] text-[color:var(--text)]"
              : "border-amber-400/18 bg-amber-400/[0.08] text-amber-50"
          }`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border ${
                  checkoutStatus === "success"
                    ? "border-[rgba(0,181,246,0.24)] bg-[rgba(0,181,246,0.10)]"
                    : "border-amber-300/20 bg-amber-300/10"
                }`}>
                  {checkoutStatus === "success"
                    ? <CheckCircle2 size={18} className="text-[color:var(--accent)]" />
                    : <CreditCard size={18} className="text-amber-200" />}
                </div>
                <div>
                  <div className={`text-sm font-black uppercase tracking-[0.18em] ${
                    checkoutStatus === "success" ? "text-[color:var(--accent)]" : "text-amber-200"
                  }`}>
                    {checkoutStatus === "success" ? "Pago aprobado" : "Orden creada"}
                  </div>
                  <p className={`mt-1 text-sm leading-7 ${
                    checkoutStatus === "success" ? "text-[color:var(--text-secondary)]" : "text-amber-100/85"
                  }`}>
                    {checkoutStatus === "success" ? (
                      <>
                        El sitio <span className="font-bold text-white">{checkoutSiteId}</span> quedó activado en modalidad de{" "}
                        <span className="font-bold text-white">{checkoutIntent === "buy" ? "compra" : "renta"}</span>.
                      </>
                    ) : (
                      <>
                        El sitio <span className="font-bold text-white">{checkoutSiteId}</span> quedó marcado en modalidad de{" "}
                        <span className="font-bold text-white">{checkoutIntent === "buy" ? "compra" : "renta"}</span> y está pendiente de confirmación de pago.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/editor/${checkoutSiteId}`}
                  className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-4 text-sm font-semibold text-white transition-all hover:bg-white/[0.1]"
                >
                  <Edit3 size={14} />
                  Abrir editor
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl editor-anim-fade-up md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00b5f6]/30 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00b5f6]/20 bg-[#00b5f6]/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#00b5f6]">
                <ShieldCheck size={13} />
                Orvenix Web Studio
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Hola, {userName.split(" ")[0]}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)] md:text-base">
                {sites.length === 0
                  ? "Crea tu primer sitio o activa un template inteligente para comenzar a operar desde un solo panel."
                  : isAdmin
                    ? `Administrando ${sites.length} sitio${sites.length !== 1 ? "s" : ""} de clientes con control visual y flujos comerciales.`
                    : `Gestionando ${sites.length} sitio${sites.length !== 1 ? "s" : ""} con editor, publicación y templates inteligentes.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/constructor"
                className="relative flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #00b5f6 0%, #0083b3 100%)",
                  boxShadow: "0 18px 42px rgba(0,131,179,0.18), 0 0 0 1px rgba(0,181,246,0.16)",
                }}
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-[100%]" />
                <Edit3 size={16} className="relative z-10" />
                <span className="relative z-10">Crear desde cero</span>
              </Link>
              <Link href="/templates" className="flex h-11 items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 text-sm font-semibold text-white/60 transition-all hover:border-[#00b5f6]/25 hover:bg-[#00b5f6]/[0.08] hover:text-[#00b5f6]">
                <Layers3 size={16} />
                Templates
              </Link>
              <CreateSiteDialog />
            </div>
          </div>
        </div>

        <DashboardBillingPanel
          plan={subscription?.plan ?? null}
          subscription={subscription ? {
            status: subscription.status,
            interval: subscription.interval,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            canceledAt: subscription.canceledAt?.toISOString() ?? null,
            provider: subscription.provider,
            stripeCustomerId: subscription.stripeCustomerId,
          } : null}
          websitesUsed={sites.filter((site) => site.userId === session.user.id || !isAdmin).length}
          isActive={isActiveSubscription}
        />

        {/* ── Stats row ── */}
        <div className="mb-8 grid grid-cols-1 gap-3 editor-anim-fade-up sm:grid-cols-4">
            {[
              { label: "Sitios totales",  value: sites.length,  icon: LayoutTemplate, color: "#00b5f6", helper: "Activos en tu cuenta" },
              { label: "Publicados",      value: published,      icon: Globe,          color: "#00b5f6", helper: "Disponibles online" },
              { label: isAdmin ? "Pendientes" : "En borrador", value: drafts, icon: Activity, color: "#0083b3", helper: "Listos para trabajar" },
              { label: "Solicitudes", value: openRequests, icon: Wrench, color: "#f59e0b", helper: "DIFM en proceso" },
            ].map(({ label, value, icon: Icon, color, helper }) => (
              <div key={label}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:border-[#00b5f6]/20">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ background: `${color}14`, borderColor: `${color}28` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">{label}</span>
                </div>
                <div>
                  <div className="text-3xl font-black tabular-nums text-white">{value}</div>
                  <div className="mt-1 text-xs text-white/30">{helper}</div>
                </div>
              </div>
            ))}
        </div>

        <EditRequestsPanel requests={editRequests} isAdmin={isAdmin} />

        {/* ── Empty state ── */}
        {sites.length === 0 && (
          <div className="editor-anim-fade-up">
            <div className="relative overflow-hidden rounded-[28px] border border-dashed border-[#00b5f6]/15 bg-white/[0.02] px-6 py-20 text-center shadow-2xl shadow-black/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,181,246,0.08),transparent_42%)]" />
              <div className="relative">

              {/* Animated icon */}
              <div className="relative inline-flex mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#00b5f6]/20 bg-[#00b5f6]/10 shadow-[0_0_45px_rgba(0,181,246,0.10)]">
                  <LayoutTemplate size={32} style={{ color: "#00b5f6" }} />
                </div>
                <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#00b5f6]/30 bg-[#00b5f6]/15"
                  style={{ animation: "editor-bounce-subtle 2s ease-in-out infinite" }}>
                  <Sparkles size={11} style={{ color: "#00b5f6" }} />
                </div>
              </div>

              <h3 className="mb-2 text-2xl font-black tracking-tight text-white">Tu workspace está listo</h3>
              <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[color:var(--text-secondary)]">
                Crea un sitio desde cero o inicia con un template inteligente para editar, comprar o rentar una web modular.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/constructor"
                  className="relative flex h-11 items-center gap-2 overflow-hidden rounded-2xl px-5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #22c55e 0%, #06b6d4 100%)",
                    boxShadow: "0 18px 42px rgba(34,197,94,0.18), 0 0 0 1px rgba(103,232,249,0.16)",
                  }}
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 hover:translate-x-[100%]" />
                  <Edit3 size={14} className="relative z-10" />
                  <span className="relative z-10">Abrir editor en blanco</span>
                  <ArrowRight size={12} className="relative z-10" />
                </Link>
                <CreateSiteDialog />
                <Link href="/webs"
                  className="flex h-11 items-center gap-2 rounded-2xl border border-[#00b5f6]/18 bg-[#00b5f6]/[0.08] px-4 text-sm font-semibold text-[#00b5f6] transition-all hover:border-[#00b5f6]/35 hover:bg-[#00b5f6]/12">
                  <LayoutTemplate size={13} />
                  Ver plantillas
                  <ArrowRight size={12} />
                </Link>
              </div>
              </div>
            </div>

            {/* Quick-start suggestions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "Landing SaaS",     href: "/editor/landing",         icon: LayoutTemplate, color: "#38bdf8" },
                { name: "Finance Dashboard", href: "/editor/finance",         icon: TrendingUp, color: "#22c55e" },
                { name: "CRM Enterprise",    href: "/editor/crm",             icon: Activity, color: "#818cf8" },
              ].map((t) => (
                <Link key={t.name} href={t.href} className="group flex items-center gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:border-[#00b5f6]/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border" style={{ background: `${t.color}12`, borderColor: `${t.color}25` }}>
                    <t.icon size={17} style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{t.name}</div>
                    <div className="text-[11px] text-white/20">Abrir en editor</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Sites grid ── */}
        {sites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 editor-anim-fade-up">
            {sites.map((site, i) => (
              <SiteCard key={site.id} site={site} index={i} />
            ))}

            {/* Add new card */}
            <Link
              href="/constructor"
              className="group flex flex-col items-center justify-center gap-3 rounded-[26px] border border-dashed border-[rgba(0,181,246,0.18)] bg-white/[0.02] p-8 text-center transition-all hover:-translate-y-0.5 hover:border-[rgba(0,181,246,0.35)] hover:bg-[rgba(0,181,246,0.04)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(0,181,246,0.20)] bg-[rgba(0,181,246,0.10)] transition-transform group-hover:scale-110">
                <Edit3 size={18} className="text-[color:var(--accent)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[color:var(--text-secondary)] transition-colors group-hover:text-[color:var(--accent)]">Editor en blanco</div>
                <div className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">Hacer todo desde cero</div>
              </div>
            </Link>

            <CreateSiteDialog triggerVariant="card" />
          </div>
        )}

        {/* ── Footer links ── */}
        <div className="mt-16 flex items-center justify-between border-t border-white/[0.06] pt-8">
          <div className="flex items-center gap-4">
            <Link href="/webs" className="flex items-center gap-1.5 text-xs text-white/20 hover:text-white/60 transition-colors">
              <TrendingUp size={12} />
              Explorar plantillas
            </Link>
          </div>
          <p className="text-[11px] text-white/15">Orvenix Editor Pro · v1.0</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_META: Record<EditRequestStatus, { label: string; color: string; icon: LucideIcon }> = {
  open: { label: "Abierto", color: "#f59e0b", icon: CircleDot },
  in_progress: { label: "En proceso", color: "#38bdf8", icon: Wrench },
  done: { label: "Resuelto", color: "#22c55e", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "#ef4444", icon: XCircle },
};

function EditRequestsPanel({
  requests,
  isAdmin,
}: {
  requests: EditRequest[];
  isAdmin: boolean;
}) {
  const visible = requests.slice(0, 6);

  return (
    <section className="mb-8 editor-anim-fade-up">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Solicitudes DIFM</h2>
          <p className="mt-1 text-xs text-white/20">
            {isAdmin
              ? "Tickets de clientes para edición profesional manual."
              : "Pide cambios manuales y sigue el estado del trabajo profesional."}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-3 py-1.5 text-xs font-semibold text-amber-200 sm:flex">
          <Wrench size={13} />
          Servicio híbrido
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-white/[0.08] bg-white/[0.02] px-5 py-6 text-sm text-white/30">
          Todavía no hay solicitudes. Usa el icono de herramienta en una tarjeta de sitio para crear el primer ticket.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((request) => {
            const meta = STATUS_META[request.status] ?? STATUS_META.open;
            const StatusIcon = meta.icon;
            return (
              <article
                key={request.id}
                className="relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 shadow-xl shadow-black/15"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold"
                        style={{ borderColor: `${meta.color}35`, background: `${meta.color}12`, color: meta.color }}
                      >
                        <StatusIcon size={11} />
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/15">
                        {request.priority}
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-bold text-white">
                      {request.siteName ?? request.templateName ?? "Solicitud profesional"}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/20">
                      {request.userEmail} · {new Date(request.createdAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-white/20">
                    {request.id.replace("ticket_", "#")}
                  </span>
                </div>

                <p className="line-clamp-2 text-xs leading-5 text-[color:var(--text-secondary)]">{request.message}</p>

                {(request.timeline || request.assets) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/20">
                    {request.timeline && <span className="rounded-full bg-white/[0.04] px-2 py-1">Plazo: {request.timeline}</span>}
                    {request.assets && <span className="rounded-full bg-white/[0.04] px-2 py-1">Recursos incluidos</span>}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {request.siteId && (
                    <Link
                      href={`/editor/${request.siteId}`}
                      className="flex h-8 items-center gap-1.5 rounded-xl border border-[rgba(0,181,246,0.15)] bg-[rgba(0,181,246,0.06)] px-3 text-xs font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(0,181,246,0.10)]"
                    >
                      <Edit3 size={12} />
                      Abrir sitio
                    </Link>
                  )}
                  {isAdmin && request.status === "open" && (
                    <form action={updateEditRequestStatusAction.bind(null, request.id, "in_progress")}>
                      <button className="h-8 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-[color:var(--text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--text)]">
                        Tomar
                      </button>
                    </form>
                  )}
                  {isAdmin && request.status !== "done" && request.status !== "cancelled" && (
                    <form action={updateEditRequestStatusAction.bind(null, request.id, "done")}>
                      <button className="h-8 rounded-xl border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.08)] px-3 text-xs font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(0,181,246,0.12)]">
                        Resolver
                      </button>
                    </form>
                  )}
                  {!isAdmin && (request.status === "open" || request.status === "in_progress") && (
                    <form action={updateEditRequestStatusAction.bind(null, request.id, "cancelled")}>
                      <button className="h-8 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-white/30 transition-colors hover:border-red-400/20 hover:bg-red-400/[0.08] hover:text-red-300">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Site card component ────────────────────────────────────────

function SiteCard({
  site,
  index,
}: {
  site: {
    id: string;
    name: string;
    description: string;
    published: boolean;
    updatedAt: Date;
    user?: { email: string; name: string | null } | null;
  };
  index: number;
}) {
  const ACCENT_COLORS = ["#38bdf8", "#22c55e", "#818cf8", "#06b6d4", "#60a5fa", "#14b8a6"];
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/18 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,181,246,0.20)]"
    >
      {/* Top accent bar */}
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${accent}90, transparent)` }} />

      {/* Preview placeholder */}
      <div className="relative h-32 overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}12 0%, rgba(2,6,23,0.15) 62%)` }}>
        <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full blur-3xl transition-opacity group-hover:opacity-90" style={{ background: `${accent}24` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="select-none text-6xl font-black tracking-tighter text-white opacity-[0.055]">
            {site.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />

        {/* Published badge */}
        {site.published && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.10)] px-2 py-1 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] editor-status-dot-live" />
            <span className="text-[10px] font-semibold text-[color:var(--accent)]">Publicado</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="truncate text-base font-bold leading-tight text-white/90 transition-colors group-hover:text-white">
            {site.name}
          </h3>
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full shadow-[0_0_18px_currentColor]" style={{ backgroundColor: accent, color: accent }} />
        </div>

        {site.description && (
          <p className="mb-3 truncate text-[11px] text-white/30">{site.description}</p>
        )}

        {site.user?.email && (
          <p className="mb-2 truncate text-[10px] text-[color:var(--accent-2)]">
            Cliente: {site.user.name ?? site.user.email}
          </p>
        )}

        <p className="mb-4 flex items-center gap-1 text-[10px] text-white/15">
          <Clock size={9} />
          {new Date(site.updatedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Link
            href={`/editor/${site.id}`}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all hover:brightness-110"
            style={{
              background: `${accent}18`,
              border: `1px solid ${accent}30`,
              color: accent,
            }}
          >
            <Edit3 size={11} />
            Editar
          </Link>

          <EditRequestDialog siteId={site.id} siteName={site.name} accent={accent} />

          {site.published && (
            <Link
              href={`/p/${site.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs text-[color:var(--text-secondary)] transition-all hover:border-[rgba(0,181,246,0.20)] hover:text-[color:var(--accent)]"
            >
              <ExternalLink size={11} />
              Ver
            </Link>
          )}

          {site.published && (
            <Link
              href={`/dashboard/analiticas/${site.id}`}
              title="Ver analíticas"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-white/20 transition-all hover:border-[rgba(0,181,246,0.20)] hover:bg-[rgba(0,181,246,0.08)] hover:text-[color:var(--accent)]"
            >
              <BarChart2 size={12} />
            </Link>
          )}

          <Link
            href={`/dashboard/recibo/${site.id}`}
            title="Ver comprobante"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-white/20 transition-all hover:border-[rgba(0,131,179,0.20)] hover:bg-[rgba(0,131,179,0.08)] hover:text-[color:var(--accent-2)]"
          >
            <FileText size={12} />
          </Link>

          <ExportDropdown siteId={site.id} />

          <form action={deleteSiteAction.bind(null, site.id)}>
            <button
              type="submit"
              title="Eliminar sitio"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] text-white/20 transition-all hover:border-red-500/20 hover:bg-red-400/[0.08] hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
