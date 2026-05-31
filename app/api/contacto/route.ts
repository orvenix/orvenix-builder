import { NextResponse } from 'next/server';
import { createContact } from '@/lib/adminCsv';
import { triggerAutomations } from '@/lib/automation/runtime';

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Solicitud inválida.' }, { status: 400 });
  }

  const nombre    = (body.nombre    ?? '').trim();
  const email     = (body.email     ?? '').trim();
  const telefono  = (body.telefono  ?? '').trim();
  const servicio  = (body.servicio  ?? '').trim();
  const presupuesto = (body.presupuesto ?? '').trim();
  const mensaje   = (body.mensaje   ?? '').trim();
  const siteId    = ((body.siteId ?? '') || process.env.ORVENIX_MARKETING_SITE_ID || '').trim();

  // Validate required fields
  if (!nombre || !email || !mensaje) {
    return NextResponse.json({ ok: false, message: 'Faltan campos obligatorios.' }, { status: 422 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ ok: false, message: 'Email inválido.' }, { status: 422 });
  }

  // Honeypot (bot trap)
  if (body._gotcha) {
    return NextResponse.json({ ok: true, message: 'Solicitud recibida.' });
  }

  try {
    const contact = await createContact({ nombre, email, telefono, servicio, presupuesto, mensaje });
    if (siteId) {
      triggerAutomations(siteId, 'contact_created', {
        contactId: contact.id,
        nombre,
        email,
        telefono,
        servicio,
        presupuesto,
        mensaje,
        eventLabel: 'contact_created',
      }).catch(() => {});
    }
  } catch {
    return NextResponse.json({ ok: false, message: 'Error interno al guardar el formulario.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Formulario enviado correctamente.' });
}
