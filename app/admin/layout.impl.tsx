import { getAuthSession } from '@/lib/auth-session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ShieldCheck } from 'lucide-react';
import { OrvenixBrand } from '@/components/OrvenixLogo';
import { ThemeToggle } from '@/components/theme/ThemeMode';
import { AdminNavLinks } from './AdminNavLinks';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session?.user) redirect('/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const initials = (session.user.name ?? session.user.email ?? 'A')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="admin-shell min-h-screen overflow-hidden text-white">
      {/* Glows del sitio principal */}
      <div className="pointer-events-none fixed inset-0">
        <div className="dashboard-glow-1" />
        <div className="dashboard-glow-2" />
        <div className="dashboard-grid" />
        <div className="dashboard-top-line" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar w-72 shrink-0 border-r border-white/[0.07] backdrop-blur-xl">

          {/* Header del sidebar */}
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.10)] text-[color:var(--accent)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <Link href="/admin" className="block">
                  <OrvenixBrand iconSize={30} textSize="base" />
                </Link>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                  Control Admin
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Badge "Orvenix Command" — con el estilo mk-promo-badge */}
          <div className="px-4 pt-4">
            <div className="rounded-[20px] border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.06)] p-4 shadow-xl shadow-black/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                Orvenix Command
              </p>
              <p className="mt-2 text-sm leading-6 text-white/35">
                Monitorea usuarios, sitios, leads y operaciones desde un solo panel visual.
              </p>
            </div>
          </div>

          <AdminNavLinks />

          {/* Footer del sidebar */}
          <div className="border-t border-white/[0.07] px-4 pb-5 pt-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--glass-border-hover)] bg-[color:rgba(0,181,246,0.10)] text-xs font-bold text-[color:var(--accent)] shadow-[0_0_24px_rgba(0,181,246,0.12)]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white/80">{session.user.name ?? 'Admin'}</p>
                <p className="truncate text-[10px] text-white/30">{session.user.email}</p>
              </div>
            </div>
            <Link
              href="/api/auth/signout"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/14 bg-red-400/[0.05] px-3 py-3 text-xs font-semibold text-red-200/80 transition-all hover:border-red-400/26 hover:bg-red-400/[0.09] hover:text-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
