import { Users, ShieldCheck, User, Globe, Calendar } from 'lucide-react';
import { editorPrisma } from '@/lib/editor-db';

export const dynamic = 'force-dynamic';

async function getUsers() {
  return editorPrisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { sites: true } },
    },
  });
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
        <ShieldCheck className="w-2.5 h-2.5" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/40 border border-white/[0.08]">
      <User className="w-2.5 h-2.5" />
      Cliente
    </span>
  );
}

export default async function AdminUsuariosPage() {
  const users = await getUsers();
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const clientCount = users.length - adminCount;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-400" />
        <h1 className="text-xl font-bold text-white">Usuarios</h1>
      </div>
      <p className="mb-8 text-sm text-white/40">
        {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''} —{' '}
        <span className="text-indigo-400">{adminCount} admin</span>,{' '}
        <span className="text-white/40">{clientCount} cliente{clientCount !== 1 ? 's' : ''}</span>.
      </p>

      {users.length === 0 ? (
        <div className="py-16 text-center text-white/30">No hay usuarios registrados aún.</div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/15">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_0.8fr_0.8fr_auto] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/30">
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Sitios</span>
            <span>Registro</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-1 items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02] md:grid-cols-[2fr_1.5fr_0.8fr_0.8fr_auto]"
              >
                {/* Name + initials */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {(u.name ?? u.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{u.name ?? '—'}</p>
                    <p className="text-[10px] text-white/20 font-mono truncate">{u.id.slice(0, 12)}…</p>
                  </div>
                </div>

                {/* Email */}
                <p className="text-xs text-white/40 truncate">{u.email}</p>

                {/* Role */}
                <div><RoleBadge role={u.role} /></div>

                {/* Sites */}
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <Globe className="w-3.5 h-3.5 text-white/20" />
                  {u._count.sites}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-white/30 whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-white/15" />
                  {new Date(u.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
