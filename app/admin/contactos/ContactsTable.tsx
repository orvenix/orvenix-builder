'use client';

import { useState, useTransition } from 'react';
import { Trash2, Search, ChevronDown, ChevronUp, Mail, Phone, MessageSquare } from 'lucide-react';
import type { Contact } from '@/lib/adminCsv';

interface Props {
  initialContacts: Contact[];
  initialQuery?: string;
  initialExpandedId?: number | null;
}

export function ContactsTable({ initialContacts, initialQuery = '', initialExpandedId = null }: Props) {
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState<number | null>(initialExpandedId);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return (
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.servicio.toLowerCase().includes(q) ||
      c.mensaje.toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este contacto? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/contactos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        startTransition(() => {
          setContacts((prev) => prev.filter((c) => c.id !== id));
          if (expanded === id) setExpanded(null);
        });
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(0,181,246,0.12)] bg-[rgba(0,181,246,0.05)] text-[color:var(--text-muted)] transition-colors">
            <Search className="h-4 w-4" />
          </div>
        </div>
        <input
          type="search"
          placeholder="Buscar por nombre, email o servicio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] pl-14 pr-24 text-sm text-[color:var(--text)] outline-none transition-all placeholder:text-[color:var(--text-muted)] hover:border-[rgba(0,181,246,0.18)] hover:bg-white/[0.06] focus:border-[rgba(0,181,246,0.45)] focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(0,181,246,0.08)]"
        />
        {query && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,181,246,0.12)] bg-[rgba(0,181,246,0.05)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[color:var(--text-secondary)]">
          {query ? 'Sin resultados para esa búsqueda.' : 'No hay contactos registrados.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[color:var(--bg)]/70 shadow-xl shadow-black/15">
          <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 border-b border-white/[0.07] bg-white/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
            <span>Nombre / Email</span>
            <span>Mensaje</span>
            <span>Servicio</span>
            <span>Fecha</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((c) => (
              <div key={c.id}>
                {/* Main row */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                  {/* Name / email */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--text)]">{c.nombre || '—'}</p>
                    <a
                      href={`mailto:${c.email}`}
                      className="flex items-center gap-1 truncate text-xs text-[color:var(--accent)] hover:text-[color:var(--accent-3)]"
                    >
                      <Mail className="w-3 h-3 shrink-0" />
                      {c.email}
                    </a>
                    {c.telefono && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--text-secondary)]">
                        <Phone className="w-3 h-3 shrink-0" />
                        {c.telefono}
                      </p>
                    )}
                  </div>

                  {/* Message preview */}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs leading-relaxed text-[color:var(--text-secondary)]">
                      {c.mensaje || '—'}
                    </p>
                    {c.mensaje && c.mensaje.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="mt-1 flex items-center gap-0.5 text-[10px] text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-3)]"
                      >
                        {expanded === c.id ? (
                          <><ChevronUp className="w-3 h-3" /> Cerrar</>
                        ) : (
                          <><ChevronDown className="w-3 h-3" /> Ver más</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Service */}
                  <div>
                    {c.servicio ? (
                      <span className="inline-block rounded-full border border-[rgba(0,181,246,0.20)] bg-[rgba(0,181,246,0.10)] px-2 py-1 text-xs text-[color:var(--accent)]">
                        {c.servicio}
                      </span>
                    ) : (
                      <span className="text-xs text-[color:var(--text-muted)]">—</span>
                    )}
                    {c.presupuesto && (
                      <p className="mt-1 text-[10px] text-[color:var(--text-muted)]">{c.presupuesto}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    <p className="text-[10px] text-[color:var(--text-muted)]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.servicio || 'Tu consulta')}`}
                      className="rounded-lg p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[rgba(0,181,246,0.10)] hover:text-[color:var(--accent)]"
                      title="Responder por email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id || isPending}
                      className="rounded-lg p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Eliminar contacto"
                    >
                      <Trash2 className={`w-4 h-4 ${deleting === c.id ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Expanded message */}
                {expanded === c.id && (
                  <div className="px-5 pb-4 bg-white/[0.02] border-t border-white/[0.04]">
                    <div className="flex items-start gap-2 pt-3">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--text-secondary)]">{c.mensaje}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="mt-3 text-right text-xs text-[color:var(--text-muted)]">
          {filtered.length} de {contacts.length} contacto{contacts.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
