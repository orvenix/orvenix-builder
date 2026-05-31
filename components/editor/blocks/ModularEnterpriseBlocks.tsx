"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Layers3,
  LockKeyhole,
  Mail,
  Network,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type HeroProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
};

export function ModularHero({
  eyebrow = "Arquitectura SaaS modular",
  title = "Una web empresarial lista para escalar, vender y operar",
  subtitle = "Sistema completo con secciones editables, narrativa comercial, componentes reutilizables y un flujo de contacto preparado para convertir oportunidades.",
  primaryCta = "Solicitar demo",
  secondaryCta = "Ver arquitectura",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#08111f] px-6 py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.18),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="motion-button inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200"
            >
              {primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#arquitectura"
              className="motion-button inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white hover:bg-white/[0.08]"
            >
              {secondaryCta}
            </a>
          </div>
        </div>

        <div className="motion-glass rounded-2xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/30">
          <div className="rounded-xl border border-white/8 bg-[#0d1727] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Enterprise stack</div>
                <div className="text-sm font-bold text-white">Production-ready modules</div>
              </div>
              <div className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                Live
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: "UI Blocks", desc: "Componentes editables y reutilizables", Icon: Layers3 },
                { label: "Data Layer", desc: "Preparado para APIs, CRM y automatizaciones", Icon: Database },
                { label: "Security", desc: "Flujos confiables para captacion enterprise", Icon: LockKeyhole },
              ].map(({ label, desc, Icon }) => (
                <div key={label} className="rounded-xl border border-white/8 bg-white/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

ModularHero.defaults = {
  eyebrow: "Arquitectura SaaS modular",
  title: "Una web empresarial lista para escalar, vender y operar",
  subtitle:
    "Sistema completo con secciones editables, narrativa comercial, componentes reutilizables y un flujo de contacto preparado para convertir oportunidades.",
  primaryCta: "Solicitar demo",
  secondaryCta: "Ver arquitectura",
} satisfies HeroProps;

type SectionCopyProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export function ModularTrustBar({
  eyebrow = "Equipos que necesitan velocidad sin perder control",
  title = "Base escalable para marketing, ventas y operaciones",
  subtitle = "Pensada para crecer por modulos: cambia textos, reorganiza secciones y extiende bloques sin reescribir la web.",
}: SectionCopyProps) {
  return (
    <section className="border-y border-slate-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{subtitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {["CRM", "Analytics", "Automations", "Support"].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-500">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

ModularTrustBar.defaults = {
  eyebrow: "Equipos que necesitan velocidad sin perder control",
  title: "Base escalable para marketing, ventas y operaciones",
  subtitle:
    "Pensada para crecer por modulos: cambia textos, reorganiza secciones y extiende bloques sin reescribir la web.",
} satisfies SectionCopyProps;

export function ModularCapabilities({
  eyebrow = "Capacidades",
  title = "Secciones completas para una web que no se queda corta",
  subtitle = "Cada bloque resuelve una parte del funnel: posicionamiento, prueba, explicacion tecnica, proceso y contacto.",
}: SectionCopyProps) {
  const items = [
    { label: "Diseño modular", desc: "Bloques independientes para escalar la web por vertical, producto o pais.", Icon: Layers3 },
    { label: "Performance comercial", desc: "Jerarquia clara, CTAs visibles y contenido orientado a conversion.", Icon: Zap },
    { label: "Arquitectura editable", desc: "Todo vive en el arbol del editor: puedes ajustar textos, ordenar y duplicar.", Icon: Network },
    { label: "Confianza enterprise", desc: "Secciones sobrias, pruebas visuales y mensajes pensados para compradores B2B.", Icon: ShieldCheck },
  ];

  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{subtitle}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map(({ label, desc, Icon }) => (
            <article key={label} className="motion-card rounded-2xl border border-slate-200 bg-white p-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-black text-slate-950">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

ModularCapabilities.defaults = {
  eyebrow: "Capacidades",
  title: "Secciones completas para una web que no se queda corta",
  subtitle:
    "Cada bloque resuelve una parte del funnel: posicionamiento, prueba, explicacion tecnica, proceso y contacto.",
} satisfies SectionCopyProps;

export function ModularArchitecture({
  eyebrow = "Arquitectura",
  title = "Preparada para integrarse con tu operacion real",
  subtitle = "Una estructura limpia para conectar formularios, CRM, analytics, automatizaciones y publicacion sin romper la experiencia visual.",
}: SectionCopyProps) {
  return (
    <section id="arquitectura" className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{subtitle}</p>
          <div className="mt-6 grid gap-3">
            {["Editor visual", "Publicacion controlada", "Formulario interactivo", "Componentes extensibles"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-200">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Input", "Formulario, clicks, campañas"],
              ["Core", "Editor tree + bloques"],
              ["Output", "Preview, publish, CRM"],
            ].map(([label, desc], index) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">
                  {index + 1}
                </div>
                <div className="text-sm font-bold">{label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-xs leading-6 text-cyan-100">
            La web se puede ampliar con nuevos bloques registrados, nuevas rutas de preview y acciones IA sin cambiar la base del producto.
          </div>
        </div>
      </div>
    </section>
  );
}

ModularArchitecture.defaults = {
  eyebrow: "Arquitectura",
  title: "Preparada para integrarse con tu operacion real",
  subtitle:
    "Una estructura limpia para conectar formularios, CRM, analytics, automatizaciones y publicacion sin romper la experiencia visual.",
} satisfies SectionCopyProps;

export function ModularProcess({
  eyebrow = "Metodo",
  title = "De idea a web editable en cuatro movimientos",
  subtitle = "Un flujo claro para construir, validar y extender sin deuda visual.",
}: SectionCopyProps) {
  const steps = [
    ["01", "Estructura", "Define la narrativa y el orden de secciones."],
    ["02", "Contenido", "Edita copy, CTAs y beneficios desde el inspector."],
    ["03", "Conversion", "Conecta el formulario y mide solicitudes."],
    ["04", "Escala", "Duplica bloques y crea variantes por audiencia."],
  ];

  return (
    <section className="bg-[#08111f] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">{subtitle}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map(([num, label, desc]) => (
            <article key={num} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-black text-cyan-300">{num}</div>
              <h3 className="mt-5 text-base font-black">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

ModularProcess.defaults = {
  eyebrow: "Metodo",
  title: "De idea a web editable en cuatro movimientos",
  subtitle: "Un flujo claro para construir, validar y extender sin deuda visual.",
} satisfies SectionCopyProps;

type ContactProps = SectionCopyProps & {
  submitLabel?: string;
};

export function ModularContactForm({
  eyebrow = "Contacto",
  title = "Cuéntanos qué quieres construir",
  subtitle = "Este formulario es interactivo en preview/publicacion y mantiene una experiencia sobria para captacion B2B.",
  submitLabel = "Enviar solicitud",
}: ContactProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [budget, setBudget] = useState("25k-50k");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 700);
  };

  return (
    <section id="contacto" className="bg-slate-50 px-6 py-20">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{subtitle}</p>
          <div className="mt-8 grid gap-3">
            {[
              ["Respuesta", "En menos de 24 horas habiles"],
              ["Enfoque", "SaaS, dashboards y operaciones digitales"],
              ["Entrega", "Prototipo editable + arquitectura modular"],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Mail className="mt-0.5 h-4 w-4 text-cyan-700" />
                <div>
                  <div className="text-sm font-bold text-slate-950">{label}</div>
                  <div className="text-xs leading-5 text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" name="name" placeholder="Tu nombre" />
            <Field label="Email" name="email" type="email" placeholder="tu@empresa.com" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Empresa" name="company" placeholder="Nombre de la empresa" />
            <label className="block">
              <span className="text-xs font-bold text-slate-700">Presupuesto</span>
              <select
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
              >
                <option value="10k-25k">$10k - $25k</option>
                <option value="25k-50k">$25k - $50k</option>
                <option value="50k+">$50k+</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-bold text-slate-700">Proyecto</span>
            <textarea
              name="message"
              rows={5}
              required
              placeholder="Describe el producto, web o flujo que necesitas..."
              className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
            />
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="motion-button mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {status === "sent" ? "Solicitud enviada" : status === "sending" ? "Enviando..." : submitLabel}
            {status === "sent" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <ArrowRight className="h-4 w-4" />}
          </button>
          {status === "sent" && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              Gracias. La solicitud quedó registrada en esta demo interactiva.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-500"
      />
    </label>
  );
}

ModularContactForm.defaults = {
  eyebrow: "Contacto",
  title: "Cuéntanos qué quieres construir",
  subtitle:
    "Este formulario es interactivo en preview/publicacion y mantiene una experiencia sobria para captacion B2B.",
  submitLabel: "Enviar solicitud",
} satisfies ContactProps;

export function ModularFooter({
  title = "Orvenix Modular",
  subtitle = "Web enterprise editable, escalable y lista para integraciones.",
}: Pick<SectionCopyProps, "title" | "subtitle">) {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-slate-950">
            <Rocket className="h-4 w-4 text-cyan-700" />
            {title}
          </div>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold text-slate-500">
          <a href="#arquitectura" className="hover:text-slate-950">Arquitectura</a>
          <a href="#contacto" className="hover:text-slate-950">Contacto</a>
          <a href="/dashboard" className="hover:text-slate-950">Dashboard</a>
        </div>
      </div>
    </footer>
  );
}

ModularFooter.defaults = {
  title: "Orvenix Modular",
  subtitle: "Web enterprise editable, escalable y lista para integraciones.",
} satisfies Pick<SectionCopyProps, "title" | "subtitle">;
