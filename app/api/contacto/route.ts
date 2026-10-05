import { NextResponse } from 'next/server';
import { createContact } from '@/lib/adminCsv';
import { triggerAutomations } from '@/lib/automation/runtime';
import { getSiteModerationStatus, isPubliclyBlocked } from '@/lib/moderation/site-moderation';
import { RATE_LIMIT_POLICIES_V1, checkRateLimitV1, rateLimitIdentityV1, rateLimitedResponseV1 } from '@/lib/security/rate-limit';

// SEC-1 (SEC0-08/10): public form -> bounded fields + per-client rate limit.
const FIELD_LIMITS = { nombre: 120, email: 254, telefono: 40, servicio: 120, presupuesto: 80, mensaje: 5000, siteId: 191 } as const;

function field(body: Record<string, unknown>, key: keyof typeof FIELD_LIMITS): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim().slice(0, FIELD_LIMITS[key]) : '';
}

export async function POST(request: Request) {
  const limited = await checkRateLimitV1(RATE_LIMIT_POLICIES_V1.contact, rateLimitIdentityV1(request));
  if (limited.ok === false) return rateLimitedResponseV1(limited);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID_BODY');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: 'Solicitud inválida.' }, { status: 400 });
  }

  const nombre    = field(body, 'nombre');
  const email     = field(body, 'email');
  const telefono  = field(body, 'telefono');
  const servicio  = field(body, 'servicio');
  const presupuesto = field(body, 'presupuesto');
  const mensaje   = field(body, 'mensaje');
  const siteId    = (field(body, 'siteId') || process.env.ORVENIX_MARKETING_SITE_ID || '').trim();

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

  // ADMIN MODERATION: a suspended or terminated site's form stores nothing and triggers no automation.
  if (siteId && isPubliclyBlocked((await getSiteModerationStatus(siteId)).state)) {
    return NextResponse.json({ ok: false, message: 'Este sitio no está disponible.' }, { status: 423 });
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
