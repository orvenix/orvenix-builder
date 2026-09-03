import { getAuthSession } from "@/lib/auth-session";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CreditCard, FileText, Globe, ShieldCheck } from "lucide-react";
import { OrvenixBrand } from "@/components/OrvenixLogo";
import { getPriceForTemplate, getTemplateInfo } from "@/lib/mercadopago";
import { ThemeToggle } from "@/components/theme/ThemeMode";
import { getSiteForRole, type UserRole } from "@/lib/auth";
import { getCheckoutCopy, normalizeCheckoutAction } from "@/lib/checkout";
import { CheckoutConfirmButton } from "./CheckoutConfirmButton";

interface CheckoutPageProps {
  searchParams?: Promise<{
    intent?: string | string[];
    siteId?: string | string[];
    templateId?: string | string[];
    error?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCheckoutCallback(params: {
  intent?: string | null;
  siteId?: string | null;
  templateId?: string | null;
  error?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.intent) query.set("intent", params.intent);
  if (params.siteId) query.set("siteId", params.siteId);
  if (params.templateId) query.set("templateId", params.templateId);
  if (params.error) query.set("error", params.error);
  const serialized = query.toString();
  return serialized ? "/checkout?" + serialized : "/checkout";
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const resolved = searchParams ? await searchParams : undefined;
  const siteId = firstParam(resolved?.siteId);
  const rawIntent = firstParam(resolved?.intent) ?? null;
  const templateId = firstParam(resolved?.templateId) ?? null;
  const paymentError = firstParam(resolved?.error) ?? null;

  if (!siteId) {
    redirect("/precios#planes");
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    const callbackUrl = buildCheckoutCallback({ intent: rawIntent, siteId, templateId, error: paymentError });
    redirect("/login?callbackUrl=" + encodeURIComponent(callbackUrl));
  }

  const action = normalizeCheckoutAction(rawIntent);
  const role = (session.user.role ?? "CLIENT") as UserRole;
  const site = await getSiteForRole(siteId, session.user.id, role);
  if (!site) notFound();

  const copy = getCheckoutCopy(action);
  const priceMxn = getPriceForTemplate(templateId, action);
  const templateInfo = getTemplateInfo(templateId);
  const priceFmt = priceMxn
    ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(priceMxn)
    : null;

  return (
    <main className="checkout-shell min-h-screen bg-[#eef9ff] text-[#062f44]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7fcff_0%,#eef9ff_48%,#ffffff_100%)]" />
        <div className="absolute -top-32 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-[#1BB3FA]/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#1794CC]/10 blur-3xl" />
      </div>

      <nav className="checkout-nav relative z-20 border-b border-[#c8e8f7]/70 bg-white/[0.82] shadow-[0_18px_50px_-44px_rgba(7,89,133,0.34)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/dashboard" className="transition-transform duration-300 hover:scale-[1.02]">
            <OrvenixBrand iconSize={38} textSize="xl" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={`/editor/${site.id}`} className="inline-flex items-center gap-2 rounded-full border border-[#c8e8f7] bg-white px-4 py-2 text-sm font-bold text-[#075985] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#1BB3FA] hover:text-[#062f44]">
              <ArrowLeft size={14} />
              Volver al editor
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="checkout-panel rounded-[28px] border border-[#c8e8f7] bg-white/[0.88] p-7 shadow-[0_24px_70px_-48px_rgba(7,89,133,0.45)] backdrop-blur-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1BB3FA]/25 bg-[#e5f6ff] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#075985]">
              <CreditCard size={13} />
              Checkout Orvenix
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#062f44] md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#426b7d]">
              {copy.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Globe, title: "Sitio listo", body: "El diseño ya quedó asociado a tu cuenta y listo para activarse." },
                { icon: CreditCard, title: "Pago integrado", body: "La confirmación interna queda lista para conectar proveedor externo." },
                { icon: FileText, title: "Trazabilidad", body: "El flujo regresa al dashboard con estado claro de la operación." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#c8e8f7] bg-[#f7fcff] p-4">
                  <item.icon className="h-5 w-5 text-[#1794CC]" />
                  <div className="mt-3 text-sm font-bold text-[#062f44]">{item.title}</div>
                  <p className="mt-1 text-xs leading-6 text-[#426b7d]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="checkout-panel rounded-[28px] border border-[#c8e8f7] bg-white/[0.88] p-7 shadow-[0_24px_70px_-48px_rgba(7,89,133,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7aa6ba]">Resumen</p>
                <h2 className="mt-2 text-2xl font-black text-[#062f44]">{site.name}</h2>
              </div>
              <span className="rounded-full border border-[#1BB3FA]/25 bg-[#e5f6ff] px-3 py-1 text-[11px] font-extrabold text-[#075985]">
                {copy.badge}
              </span>
            </div>

            {/* Error de pago fallido */}
            {paymentError === "payment_failed" && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                El pago no pudo completarse. Puedes intentarlo de nuevo o contactarnos.
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-2xl border border-[#c8e8f7] bg-[#f7fcff] p-4">
              <SummaryRow label="Sitio" value={site.name} />
              {templateInfo && <SummaryRow label="Template" value={templateInfo.name} />}
              <SummaryRow label="Modalidad" value={action === "buy" ? "Compra única" : "Renta mensual"} />
              <SummaryRow label="Estado" value={site.published ? "Publicado" : "Listo para activar"} />
            </div>

            {/* Precio */}
            {priceFmt && (
              <div className="mt-5 rounded-2xl border border-[#1BB3FA]/25 bg-[#e5f6ff] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#426b7d]">
                    {action === "buy" ? "Total a pagar" : "Renta mensual"}
                  </p>
                  <p className="text-2xl font-black text-[#075985]">{priceFmt}</p>
                </div>
                {action === "rent" && (
                  <p className="mt-1 text-xs text-[#426b7d]">Renovación automática mensual · Cancela cuando quieras</p>
                )}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-[#c8e8f7] bg-white p-4 text-sm leading-7 text-[#426b7d]">
              <div className="flex items-center gap-2 font-bold text-[#075985]">
                <BadgeCheck size={16} />
                Pago seguro con MercadoPago
              </div>
              <p className="mt-2 text-[#426b7d]">
                Serás redirigido a MercadoPago para completar el pago. Tu sitio se activará automáticamente al confirmar.
              </p>
            </div>

            <div className="mt-6">
              <CheckoutConfirmButton
                action={action}
                siteId={site.id}
                templateId={templateId}
                priceMxn={priceMxn}
              />
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs leading-6 text-[#7aa6ba]">
              <ShieldCheck size={11} />
              Tus datos de pago son procesados por MercadoPago · Orvenix no almacena datos de tarjetas
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#c8e8f7] pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7aa6ba]">{label}</span>
      <span className="max-w-[58%] truncate text-sm font-semibold text-[#062f44]">{value}</span>
    </div>
  );
}
