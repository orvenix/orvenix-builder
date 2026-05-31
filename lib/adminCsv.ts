import { promises as fs } from 'fs';
import path from 'path';
import { editorPrisma } from '@/lib/editor-db';

export interface Contact {
  id: number;
  createdAt: string;
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  presupuesto: string;
  mensaje: string;
  archivo: string;
}

export interface CreateContactInput {
  nombre: string;
  email: string;
  telefono?: string;
  servicio?: string;
  presupuesto?: string;
  mensaje: string;
  archivo?: string;
}

const CSV_PATH = path.join(process.cwd(), 'sistema', 'contactos.csv');
let contactsTableAvailable: boolean | null = null;

// RFC 4180 CSV parser — handles quoted fields with embedded newlines and commas.
function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      fields.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r' && next === '\n') {
      fields.push(field);
      if (fields.some((f) => f !== '')) rows.push([...fields]);
      fields.length = 0;
      field = '';
      i += 2;
      continue;
    }

    if (ch === '\n') {
      fields.push(field);
      if (fields.some((f) => f !== '')) rows.push([...fields]);
      fields.length = 0;
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Flush last row
  fields.push(field);
  if (fields.some((f) => f !== '')) rows.push([...fields]);

  return rows;
}

// Serialize a single CSV field — quotes if needed.
function csvField(val: string): string {
  if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

function serializeCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvField).join(',')).join('\n') + '\n';
}

async function ensureDir() {
  await fs.mkdir(path.dirname(CSV_PATH), { recursive: true });
}

async function hasContactsTable(): Promise<boolean> {
  if (contactsTableAvailable !== null) return contactsTableAvailable;

  try {
    const rows = await editorPrisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'contacts'",
    );
    contactsTableAvailable = Number(rows[0]?.count ?? 0) > 0;
  } catch {
    contactsTableAvailable = false;
  }

  return contactsTableAvailable;
}

function normalizeContact(contact: {
  id: number;
  createdAt: Date | string;
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  presupuesto: string;
  mensaje: string;
  archivo: string;
}): Contact {
  return {
    ...contact,
    createdAt: contact.createdAt instanceof Date
      ? contact.createdAt.toISOString()
      : contact.createdAt,
  };
}

async function readCsvContacts(): Promise<Contact[]> {
  try {
    await ensureDir();
    const raw = await fs.readFile(CSV_PATH, 'utf-8');
    const rows = parseCsv(raw);
    return rows.map((row, i): Contact => ({
      id:          i + 1,
      createdAt:   row[0] ?? '',
      nombre:      row[1] ?? '',
      email:       row[2] ?? '',
      telefono:    row[3] ?? '',
      servicio:    row[4] ?? '',
      presupuesto: row[5] ?? '',
      mensaje:     row[6] ?? '',
      archivo:     row[7] ?? '',
    }));
  } catch {
    return [];
  }
}

async function appendCsvContact(input: CreateContactInput): Promise<Contact> {
  const contacts = await readCsvContacts();
  const contact: Contact = {
    id: contacts.length + 1,
    createdAt: new Date().toISOString(),
    nombre: input.nombre,
    email: input.email,
    telefono: input.telefono ?? '',
    servicio: input.servicio ?? '',
    presupuesto: input.presupuesto ?? '',
    mensaje: input.mensaje,
    archivo: input.archivo ?? '',
  };
  const row = [
    contact.createdAt,
    contact.nombre,
    contact.email,
    contact.telefono,
    contact.servicio,
    contact.presupuesto,
    contact.mensaje,
    contact.archivo,
  ];
  await ensureDir();
  await fs.appendFile(CSV_PATH, row.map(csvField).join(',') + '\n', 'utf-8');
  return contact;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  if (await hasContactsTable()) {
    try {
      const contact = await editorPrisma.contact.create({
        data: {
          nombre: input.nombre,
          email: input.email,
          telefono: input.telefono ?? '',
          servicio: input.servicio ?? '',
          presupuesto: input.presupuesto ?? '',
          mensaje: input.mensaje,
          archivo: input.archivo ?? '',
        },
      });
      return normalizeContact(contact);
    } catch {
      contactsTableAvailable = false;
    }
  }

  return appendCsvContact(input);
}

export async function readContacts(): Promise<Contact[]> {
  if (await hasContactsTable()) {
    try {
      const contacts = await editorPrisma.contact.findMany({
        orderBy: { createdAt: 'asc' },
      });
      if (contacts.length > 0) return contacts.map(normalizeContact);
    } catch {
      contactsTableAvailable = false;
    }
  }

  return readCsvContacts();
}

export async function deleteContact(id: number): Promise<{ ok: boolean }> {
  if (await hasContactsTable()) {
    try {
      await editorPrisma.contact.deleteMany({ where: { id } });
      return { ok: true };
    } catch {
      contactsTableAvailable = false;
    }
  }

  const contacts = await readContacts();
  const remaining = contacts.filter((c) => c.id !== id);
  const rows = remaining.map((c) => [
    c.createdAt, c.nombre, c.email, c.telefono,
    c.servicio, c.presupuesto, c.mensaje, c.archivo,
  ]);
  await ensureDir();
  await fs.writeFile(CSV_PATH, serializeCsv(rows), 'utf-8');
  return { ok: true };
}
