import { getAuthSession } from '@/lib/auth-session';
import { redirect } from 'next/navigation';
import { AdminMobileNav } from './AdminMobileNav';
import { AdminSidebarContent } from './AdminSidebarContent';

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
  const userName = session.user.name ?? 'Admin';
  const userEmail = session.user.email ?? null;

  return (
    <div className="admin-shell min-h-screen overflow-hidden text-[color:var(--text)]">
      {/* Glows del sitio principal */}
      <div className="pointer-events-none fixed inset-0">
        <div className="dashboard-glow-1" />
        <div className="dashboard-glow-2" />
        <div className="dashboard-grid" />
        <div className="dashboard-top-line" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="admin-sidebar admin-desktop-sidebar hidden w-72 shrink-0 flex-col border-r border-white/[0.07] backdrop-blur-xl lg:flex">
          <AdminSidebarContent initials={initials} userName={userName} userEmail={userEmail} />
        </aside>

        <div className="admin-main-column flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminMobileNav initials={initials} userName={userName} userEmail={userEmail} />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
