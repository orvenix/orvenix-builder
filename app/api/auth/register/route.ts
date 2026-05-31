import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/auth";
import { getStorageMode } from "@/lib/storage-mode";
import { sendWelcomeEmail } from "@/lib/email";
import { recordReferral } from "@/lib/affiliates";
import { serverError } from "@/lib/server-log";

function toReadableError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (getStorageMode() === "file") {
    return "No se pudo crear la cuenta en el almacenamiento local.";
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("usuario:password@")) {
    return "No se pudo crear la cuenta porque la base de datos local no esta configurada.";
  }

  if (message.toLowerCase().includes("connect") || message.toLowerCase().includes("database")) {
    return "No se pudo crear la cuenta porque la base de datos no responde.";
  }

  return "No se pudo crear la cuenta.";
}

function getRefCodeFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? ""
  const match = cookieHeader.match(/orvenix_ref=([A-Z0-9]{6,16})/i)
  return match?.[1]?.toUpperCase() ?? null
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
    }

    const user = await createUser(normalizedEmail, name ?? normalizedEmail.split("@")[0], password);

    // Bienvenida asíncrona — no bloqueamos el registro si el email falla
    sendWelcomeEmail({ name: user.name ?? name ?? normalizedEmail.split("@")[0], email: normalizedEmail }).catch(
      (err) => serverError("[register] Welcome email failed", err)
    );

    // Registrar referido si viene de un link de afiliado
    const refCode = getRefCodeFromCookie(request)
    if (refCode) {
      recordReferral({ affiliateCode: refCode, referredEmail: normalizedEmail, referredUserId: user.id }).catch(
        (err) => serverError("[register] Referral tracking failed", err)
      )
    }

    return NextResponse.json({ ok: true, id: user.id });
  } catch (error) {
    const message = toReadableError(error);
    const detail = error instanceof Error ? error.message : undefined;
    if (process.env.NODE_ENV === "development" && detail) {
      serverError("REGISTER_ERROR", detail);
      return NextResponse.json({ error: message, detail }, { status: 500 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
