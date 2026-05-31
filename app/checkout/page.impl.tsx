import { getAuthSession } from "@/lib/auth-session";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CreditCard, FileText, Globe, Sparkles, ShieldCheck } from "lucide-react";
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

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const resolved = searchParams ? await searchParams : undefined;
  const siteId = firstParam(resolved?.siteId);
  if (!siteId) notFound();

  const action = normalizeCheckoutAction(firstParam(resolved?.intent));
  const templateId = firstParam(resolved?.templateId) ?? null;
  const paymentError = firstParam(resolved?.error) ?? null;
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
    <main className="checkout-shell min-h-screen bg-[#040408] text-white">
      <div className="theme-bg-glows pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[#040408]" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <nav className="checkout-nav relative z-20 border-b border-white/[0.07] bg-[#040408]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/dashboard" className="transition-transform duration-300 hover:scale-[1.02]">
            <OrvenixBrand iconSize={38} textSize="xl" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href={`/editor/${site.id}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white">
              <ArrowLeft size={14} />
              Volver al editor
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="checkout-panel rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              <Sparkles size={13} />
              Checkout Orvenix
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/40">
              {copy.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Globe, title: "Sitio listo", body: "El diseño ya quedó asociado a tu cuenta y listo para activarse." },
                { icon: CreditCard, title: "Pago integrado", body: "La confirmación interna queda lista para conectar proveedor externo." },
                { icon: FileText, title: "Trazabilidad", body: "El flujo regresa al dashboard con estado claro de la operación." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <item.icon className="h-5 w-5 text-indigo-400" />
                  <div className="mt-3 text-sm font-bold text-white">{item.title}</div>
                  <p className="mt-1 text-xs leading-6 text-white/30">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="checkout-panel rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">Resumen</p>
                <h2 className="mt-2 text-2xl font-black text-white">{site.name}</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-200">
                {copy.badge}
              </span>
            </div>

            {/* Error de pago fallido */}
            {paymentError === "payment_failed" && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                El pago no pudo completarse. Puedes intentarlo de nuevo o contactarnos.
              </div>
            )}

            <div className="mt-6 space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <SummaryRow label="Sitio" value={site.name} />
              {templateInfo && <SummaryRow label="Template" value={templateInfo.name} />}
              <SummaryRow label="Modalidad" value={action === "buy" ? "Compra única" : "Renta mensual"} />
              <SummaryRow label="Estado" value={site.published ? "Publicado" : "Listo para activar"} />
            </div>

            {/* Precio */}
            {priceFmt && (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/60">
                    {action === "buy" ? "Total a pagar" : "Renta mensual"}
                  </p>
                  <p className="text-2xl font-black text-emerald-300">{priceFmt}</p>
                </div>
                {action === "rent" && (
                  <p className="mt-1 text-xs text-white/30">Renovación automática mensual · Cancela cuando quieras</p>
                )}
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4 text-sm leading-7 text-indigo-200/85">
              <div className="flex items-center gap-2 font-bold text-indigo-200">
                <BadgeCheck size={16} />
                Pago seguro con MercadoPago
              </div>
              <p className="mt-2 text-indigo-200/75">
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

            <p className="mt-4 text-xs leading-6 text-white/20 flex items-center justify-center gap-1.5">
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
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/20">{label}</span>
      <span className="max-w-[58%] truncate text-sm font-semibold text-white/80">{value}</span>
    </div>
  );
}
