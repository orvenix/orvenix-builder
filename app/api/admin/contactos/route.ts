import { getAuthSession } from '@/lib/auth-session';
import { NextResponse } from 'next/server';
import { readContacts } from '@/lib/adminCsv';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const contacts = await readContacts();
  return NextResponse.json(contacts);
}
