import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  Edit3,
  Eye,
  Layers3,
  Repeat,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getRealTemplate } from "@/lib/realTemplates";
import { selfEditTemplateAction } from "../actions";

interface TemplatePreviewPageProps {
  params: Promise<{ id: string }>;
}

const deliveryItems = [
  "Diseño responsive listo para desktop, tablet y móvil",
  "Estructura editable desde el constructor Orvenix",
  "Secciones preparadas para contenido real del negocio",
  "Base lista para conectar dominio, analytics y checkout",
];

const qualitySignals = [
  { label: "Responsive", value: "3 vistas", icon: Layers3 },
  { label: "Edición", value: "Visual", icon: Sparkles },
  { label: "Entrega", value: "Lista", icon: ShieldCheck },
  { label: "Velocidad", value: "Next.js", icon: Zap },
];

export default async function TemplatePreviewPage({ params }: TemplatePreviewPageProps) {
  const { id } = await params;
  const template = getRealTemplate(id);
  if (!template) notFound();

  const Icon = template.Icon;

  return (
    <main className="min-h-screen bg-[#07080d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07080d]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/templates"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/55 transition hover:bg-white/[0.06] hover:text-white"
              title="Volver al catálogo"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{template.name}</div>
              <div className="truncate text-[11px] text-white/35">{template.category}</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href={template.livePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-bold text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Eye size={14} />
              Abrir web real
            </Link>
            <form action={selfEditTemplateAction.bind(null, template.id)}>
              <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
                <Edit3 size={14} />
                Editar
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
        <div className="flex flex-col justify-center">
          <div
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold"
            style={{ borderColor: `${template.accent}38`, backgroundColor: `${template.accent}14`, color: template.accent }}
          >
            <Icon size={14} />
            Web profesional lista para cliente
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.94] tracking-tight md:text-6xl">
            {template.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/52">
            {template.description} Esta versión se presenta como una solución comercial completa: vista real, edición visual, compra, renta y personalización desde tu flujo SaaS.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            {qualitySignals.map(({ label, value, icon: SignalIcon }) => (
              <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                <SignalIcon size={17} style={{ color: template.accent }} />
                <div className="mt-3 text-lg font-black">{value}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/30">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <form action={selfEditTemplateAction.bind(null, template.id)}>
              <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-white/90">
                <Edit3 size={16} />
                Editar yo mismo
              </button>
            </form>
            <Link
              href={template.livePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-white/72 transition hover:bg-white/[0.08] hover:text-white"
            >
              Ver web completa
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-6 rounded-[2rem] opacity-20 blur-3xl"
            style={{ background: `radial-gradient(circle at 50% 20%, ${template.accent}, transparent 62%)` }}
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
            <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-100 px-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 flex-1 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-slate-400">
                orvenix.io{template.livePath}
              </div>
            </div>
            <iframe
              src={template.livePath}
              title={template.name}
              className="h-[620px] w-full border-0 bg-white"
              allow="clipboard-write; fullscreen"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.08] bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-white/28">Qué incluye</div>
            <div className="grid gap-3 md:grid-cols-2">
              {deliveryItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-white/[0.08] bg-[#0c0f18] p-4">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: template.accent }} />
                  <span className="text-sm leading-6 text-white/62">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/[0.1] bg-[#0c0f18] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Opciones</div>
                <h2 className="mt-2 text-2xl font-black">Activar esta web</h2>
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br ${template.gradient}`}>
                <Icon size={22} />
              </div>
            </div>

            <div className="grid gap-3">
              <Link href={`/checkout/start?templateId=${template.id}&intent=buy`}>
                <span className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-left font-black text-white transition hover:bg-emerald-500">
                  <span className="flex items-center gap-2">
                    <CreditCard size={16} />
                    Comprar
                  </span>
                  <span>${template.purchasePriceMxn.toLocaleString("es-MX")} MXN</span>
                </span>
              </Link>

              <Link href={`/checkout/start?templateId=${template.id}&intent=rent`}>
                <span className="flex w-full items-center justify-between rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-left font-black text-cyan-100 transition hover:bg-cyan-400/15">
                  <span className="flex items-center gap-2">
                    <Repeat size={16} />
                    Rentar
                  </span>
                  <span>${template.rentalPriceMxn.toLocaleString("es-MX")}/mes</span>
                </span>
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/35">
              Si el usuario no tiene sesión, el flujo conserva la intención y lo devuelve al proceso después del registro.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: TemplatePreviewPageProps) {
  const { id } = await params;
  const template = getRealTemplate(id);
  return {
    title: template ? `${template.name} · Web profesional` : "Plantilla",
    description: template?.description,
  };
}
