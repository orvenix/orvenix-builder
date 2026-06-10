import { MessageSquare, Download } from 'lucide-react';
import { readContacts } from '@/lib/adminCsv';
import { ContactsTable } from './ContactsTable';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams?: Promise<{ q?: string; contactId?: string }>;
}

export default async function AdminContactosPage({ searchParams }: Props) {
  const contacts = await readContacts();
  const rawSearchParams = await searchParams;
  const initialQuery = (rawSearchParams?.q ?? '').trim();
  const parsedContactId = Number(rawSearchParams?.contactId ?? '');
  const initialExpandedId = Number.isInteger(parsedContactId)
    ? contacts.find((contact) => contact.id === parsedContactId)?.id ?? null
    : null;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[color:var(--accent)]" />
            <h1 className="text-xl font-bold text-[color:var(--text)]">Contactos</h1>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">
            {contacts.length} mensaje{contacts.length !== 1 ? 's' : ''} recibido{contacts.length !== 1 ? 's' : ''} a través del formulario de contacto.
          </p>
        </div>

        {contacts.length > 0 && (
          <a
            href="/api/admin/contactos"
            download="contactos.json"
            className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-[color:var(--text-secondary)] transition-all hover:-translate-y-0.5 hover:border-[rgba(0,181,246,0.20)] hover:text-[color:var(--accent)]"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </a>
        )}
      </div>

      <ContactsTable
        initialContacts={contacts}
        initialQuery={initialQuery}
        initialExpandedId={initialExpandedId}
      />
    </div>
  );
}
