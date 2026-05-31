import { Globe, CheckCircle2, Clock, ExternalLink, Calendar } from 'lucide-react';
import { getAllSitesForAdmin } from '@/lib/auth';
import { getAuthSession } from '@/lib/auth-session';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminSitiosPage() {
  await getAuthSession();
  const sites = await getAllSitesForAdmin();
  const published = sites.filter((s) => s.published);
  const drafts = sites.filter((s) => !s.published);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Globe className="w-5 h-5 text-[color:var(--accent)]" />
        <h1 className="text-xl font-bold text-[color:var(--text)]">Sitios</h1>
      </div>
      <p className="mb-8 text-sm text-[color:var(--text-secondary)]">
        {sites.length} sitio{sites.length !== 1 ? 's' : ''} en total —{' '}
        <span className="text-[color:var(--accent)]">{published.length} publicado{published.length !== 1 ? 's' : ''}</span>,{' '}
        <span className="text-[color:var(--text-secondary)]">{drafts.length} borrador{drafts.length !== 1 ? 'es' : ''}</span>.
      </p>

      {sites.length === 0 ? (
        <div className="py-16 text-center text-[color:var(--text-muted)]">No hay sitios creados aún.</div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/15">
          <div className="hidden md:grid grid-cols-[2fr_2fr_0.8fr_1fr_auto] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
            <span>Sitio</span>
            <span>Propietario</span>
            <span>Estado</span>
            <span>Actualizado</span>
            <span />
          </div>

          <div className="divide-y divide-white/[0.05]">
            {sites.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-1 items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02] md:grid-cols-[2fr_2fr_0.8fr_1fr_auto]"
              >
                {/* Site name */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[color:var(--text)]">{s.name}</p>
                  {s.description && (
                    <p className="truncate text-xs text-[color:var(--text-secondary)]">{s.description}</p>
                  )}
                  <p className="mt-0.5 truncate font-mono text-[10px] text-[color:var(--text-muted)]">{s.id}</p>
                </div>

                {/* Owner */}
                <div className="min-w-0">
                  {s.user ? (
                    <>
                      <p className="truncate text-xs text-[color:var(--text-secondary)]">{s.user.name ?? '—'}</p>
                      <p className="truncate text-[10px] text-[color:var(--text-muted)]">{s.user.email}</p>
                    </>
                  ) : (
                    <span className="text-xs text-[color:var(--text-muted)]">Sin propietario</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  {s.published ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--glass-border-hover)] bg-[rgba(0,181,246,0.12)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--accent)]">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Publicado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--text-secondary)]">
                      <Clock className="w-2.5 h-2.5" />
                      Borrador
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[color:var(--text-secondary)]">
                  <Calendar className="h-3 w-3 text-[color:var(--text-muted)]" />
                  {new Date(s.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/editor/${s.id}`}
                    className="rounded-lg p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[rgba(0,181,246,0.10)] hover:text-[color:var(--accent)]"
                    title="Abrir en editor"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
