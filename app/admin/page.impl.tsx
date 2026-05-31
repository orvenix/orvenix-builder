import { getAuthSession } from '@/lib/auth-session';
import Link from 'next/link';
import { Users, Globe, MessageSquare, TrendingUp, ExternalLink, Wrench, Share2, CircleDot, Rocket, CreditCard } from 'lucide-react';
import { readContacts } from '@/lib/adminCsv';
import { editorPrisma } from '@/lib/editor-db';
import { getEditRequestsForRole } from '@/lib/editRequests';
import { getAllAffiliates } from '@/lib/affiliates';
import { getProductionReadinessReport } from '@/lib/production-readiness';
import { getSuperBuilderProgressReport } from '@/lib/super-builder-progress';

async function getStats(userId: string) {
  const [contacts, userCount, siteCount, publishedCount, tickets, affiliates] = await Promise.all([
    readContacts(),
    editorPrisma.user.count(),
    editorPrisma.editorWebsite.count(),
    editorPrisma.editorWebsite.count({ where: { published: true } }),
    getEditRequestsForRole(userId, 'ADMIN'),
    getAllAffiliates(),
  ]);

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;

  return {
    contactCount: contacts.length,
    userCount,
    siteCount,
    publishedCount,
    openTickets,
    activeAffiliates,
    recent: contacts.slice(-5).reverse(),
    recentTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').slice(0, 4),
  };
}

export default async function AdminPage() {
  const session = await getAuthSession();
  const readiness = getProductionReadinessReport();
  const superBuilder = getSuperBuilderProgressReport();
  const {
    contactCount, userCount, siteCount, publishedCount,
    openTickets, activeAffiliates, recent, recentTickets,
  } = await getStats(session?.user?.id ?? '');

  const stats = [
    { label: 'Tickets DIFM abiertos', value: openTickets,      icon: Wrench,        href: '/admin/difm',       color: 'text-amber-400' },
    { label: 'Afiliados activos',      value: activeAffiliates, icon: Share2,        href: '/admin/afiliados',  color: 'text-emerald-400' },
    { label: 'Usuarios registrados',   value: userCount,        icon: Users,         href: '/admin/usuarios',   color: 'text-indigo-400' },
    { label: 'Contactos recibidos',    value: contactCount,     icon: MessageSquare, href: '/admin/contactos',  color: 'text-indigo-400' },
    { label: 'Sitios creados',         value: siteCount,        icon: Globe,         href: '/admin/sitios',     color: 'text-indigo-400' },
    { label: 'Sitios publicados',      value: publishedCount,   icon: TrendingUp,    href: '/admin/sitios',     color: 'text-cyan-400' },
  ];

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    open:        { label: 'Abierto',     color: 'text-blue-400' },
    in_progress: { label: 'En progreso', color: 'text-amber-400' },
  };

  const readinessMeta = readiness.summary === 'ready'
    ? {
        label: 'Listo para validar afuera',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        iconClassName: 'text-emerald-300',
      }
    : {
        label: 'Requiere atención interna',
        className: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
        iconClassName: 'text-amber-300',
      };

  const automaticReady = readiness.automaticChecks.filter((item) => item.status === 'ready').length;
  const automaticAttention = readiness.automaticChecks.filter((item) => item.status === 'attention').length;

  return (
    <div className="admin-page">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl editor-anim-fade-up md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/30 to-transparent" />
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
          <TrendingUp size={13} />
          Centro de control
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Panel de administración</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40 md:text-base">
          Supervisa leads, usuarios, sitios publicados y operaciones internas.
        </p>
        <p className="mt-4 text-sm text-white/40">
          Sesión como <span className="text-indigo-400">{session?.user?.email}</span>
        </p>
      </div>

      {/* Stats grid 3+3 */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative overflow-hidden rounded-[26px] border border-white/8 bg-white/3 p-5 shadow-xl shadow-black/15 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <div className={`text-3xl font-black ${s.color} mb-1`}>{s.value}</div>
            <div className="text-xs text-white/30">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className={`mb-6 overflow-hidden rounded-[28px] border p-6 shadow-xl shadow-black/15 ${readinessMeta.className}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-current/20 bg-black/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              <Rocket className={`h-3.5 w-3.5 ${readinessMeta.iconClassName}`} />
              Salida a producción
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">{readinessMeta.label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {automaticReady} chequeo{automaticReady === 1 ? '' : 's'} automático{automaticReady === 1 ? '' : 's'} ya están alineados y
              {' '}{automaticAttention} requiere{automaticAttention === 1 ? '' : 'n'} atención antes de pasar a validaciones públicas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Detectado aquí</p>
              <div className="mt-3 space-y-2">
                {readiness.automaticChecks.slice(0, 3).map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-white/75">{item.label}</span>
                    <span className={item.status === 'ready' ? 'text-emerald-300' : 'text-amber-300'}>
                      {item.status === 'ready' ? 'Listo' : 'Atención'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Siguiente tramo</p>
              <div className="mt-3 space-y-2 text-xs text-white/70">
                {readiness.manualChecks.slice(0, 3).map((item) => (
                  <p key={item.key}>{item.label}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/billing" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:text-white">
            <CreditCard className="h-4 w-4" /> Abrir checklist de billing
          </Link>
          <Link href="/estado" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/10 px-4 py-2 text-sm font-semibold text-white/80 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:text-white">
            <Globe className="h-4 w-4" /> Ver health público
          </Link>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-[28px] border border-white/8 bg-white/3 p-6 shadow-xl shadow-black/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
              <Rocket className="h-3.5 w-3.5 text-sky-300" />
              Super Builder
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Progreso del constructor</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {superBuilder.strongStages} de {superBuilder.totalStages} bloques estratégicos ya tienen base fuerte o parcial.
              El foco real sigue en reforzar arquitectura sin perder el ritmo de producto.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 lg:min-w-[260px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Avance estimado</p>
            <div className="mt-3 text-4xl font-black text-sky-300">{superBuilder.percent}%</div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-linear-to-r from-sky-400 to-cyan-300"
                style={{ width: `${superBuilder.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Bloque activo</p>
            <p className="mt-3 text-sm font-semibold text-white">
              {superBuilder.current ? `${superBuilder.current.code} · ${superBuilder.current.title}` : 'Sin bloque activo'}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {superBuilder.current?.summary ?? 'Todo el roadmap principal está sincronzado.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Siguiente recomendado</p>
            <p className="mt-3 text-sm font-semibold text-white">
              {superBuilder.next ? `${superBuilder.next.code} · ${superBuilder.next.title}` : 'Sin siguiente bloque'}
            </p>
            <p className="mt-2 text-xs leading-5 text-white/60">
              {superBuilder.next?.summary ?? 'No hay próximos bloques definidos.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Últimos bloques fuertes</p>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              {superBuilder.stages.filter((stage) => stage.status === 'completed' || stage.status === 'partial').slice(-3).map((stage) => (
                <p key={stage.code}>{stage.code} · {stage.title}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Tickets DIFM recientes */}
        <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/3 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between border-b border-white/7 px-6 py-4">
            <h2 className="text-sm font-semibold text-white/60 flex items-center gap-2">
              <Wrench size={14} className="text-amber-400" /> Tickets DIFM pendientes
            </h2>
            <Link href="/admin/difm" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          {recentTickets.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-white/30">Sin tickets pendientes ✓</div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentTickets.map((t) => {
                const st = STATUS_LABEL[t.status] ?? { label: t.status, color: 'text-white/40' };
                return (
                  <div key={t.id} className="px-6 py-3.5 flex items-center gap-4">
                    <CircleDot className={`w-3.5 h-3.5 shrink-0 ${st.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{t.siteName ?? t.templateName ?? '—'}</p>
                      <p className="text-xs text-white/30 truncate">{t.userEmail}</p>
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${st.color}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contactos recientes */}
        <div className="overflow-hidden rounded-[28px] border border-white/8 bg-white/3 shadow-xl shadow-black/15">
          <div className="flex items-center justify-between border-b border-white/7 px-6 py-4">
            <h2 className="text-sm font-semibold text-white/60">Últimos contactos</h2>
            <Link href="/admin/contactos" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver todos →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-white/30">No hay contactos aún.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((c) => (
                <div key={c.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {(c.nombre || c.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{c.nombre || '—'}</p>
                    <p className="text-xs text-white/30 truncate">{c.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-white/40">{c.servicio || '—'}</p>
                    <p className="text-[10px] text-white/20">{c.createdAt.slice(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard" className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-white/40 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20 hover:text-indigo-200">
          <Globe className="w-4 h-4" /> Dashboard de cliente
        </Link>
        <Link href="/" className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-white/40 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20 hover:text-indigo-200">
          <ExternalLink className="w-4 h-4" /> Ver sitio público
        </Link>
        <Link href="/constructor" className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-white/40 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20 hover:text-indigo-200">
          <TrendingUp className="w-4 h-4" /> Crear sitio demo
        </Link>
      </div>
    </div>
  );
}
