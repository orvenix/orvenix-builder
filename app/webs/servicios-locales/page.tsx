"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

const services = [
  { title: "Instalación y puesta a punto", price: "desde $890", text: "Visita técnica, diagnóstico inicial y configuración del servicio en sitio.", icon: Wrench },
  { title: "Mantenimiento preventivo", price: "desde $1,490", text: "Revisión programada para reducir fallas, gastos urgentes y tiempos muertos.", icon: ShieldCheck },
  { title: "Atención express", price: "desde $690", text: "Respuesta prioritaria para negocios que necesitan resolver el mismo día.", icon: Clock },
  { title: "Plan mensual", price: "desde $2,900", text: "Cobertura recurrente con agenda, soporte y reportes para operación estable.", icon: CalendarCheck },
];

const zones = ["San Pedro", "Monterrey", "Santa Catarina", "Guadalupe", "Apodaca", "Cumbres"];

const process = [
  ["Agenda", "El cliente elige horario, zona y tipo de servicio desde WhatsApp o formulario."],
  ["Diagnóstico", "Se confirma alcance, prioridad, materiales y precio estimado antes de iniciar."],
  ["Ejecución", "Equipo certificado atiende en sitio con evidencia, checklist y seguimiento."],
  ["Garantía", "Se entrega resumen, recomendaciones y canal de soporte posterior."],
];

const testimonials = [
  { name: "Laura M.", role: "Administradora de consultorio", text: "La página comunica confianza rápido. Los pacientes entienden horarios, zonas y cómo agendar sin llamar tres veces." },
  { name: "Sergio V.", role: "Dueño de negocio local", text: "Nos ayudó a convertir visitas en cotizaciones. El botón de WhatsApp y los paquetes dejaron el proceso más claro." },
  { name: "Daniela R.", role: "Operaciones", text: "Es modular: cambiamos servicios, cobertura y preguntas frecuentes sin rediseñar todo." },
];

const faqs = [
  ["¿Esta página sirve para cualquier servicio local?", "Sí. La estructura se puede adaptar a clínicas, talleres, estética, mantenimiento, abogados, consultorios, limpieza, reparación o servicios profesionales."],
  ["¿Puede conectar WhatsApp y agenda?", "Sí. Los CTAs están listos para WhatsApp, llamada, formulario o una agenda externa como Calendly/Google Calendar."],
  ["¿Incluye secciones para precios?", "Sí. Tiene servicios, paquetes, proceso, zona de cobertura y FAQ para reducir dudas antes de contactar."],
  ["¿Se puede volver editable?", "Sí. Está organizada por arrays de contenido, así que puede migrarse al editor visual o conectarse a datos dinámicos."],
];

export default function ServiciosLocalesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const onScroll = useCallback(() => {
    const total = document.body.scrollHeight - window.innerHeight;
    setScrollProgress(total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0);
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="fixed top-0 left-0 z-60 h-0.5 bg-linear-to-r from-cyan-600 to-slate-700 transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 0 ? 1 : 0 }} />
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-3" aria-label="Norte Service inicio">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-700 text-white">
              <Wrench size={19} />
            </span>
            <span>
              <span className="block text-sm font-black">NORTE SERVICE CO.</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Servicios locales</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 text-sm font-bold text-slate-600 lg:flex">
            {[["Servicios","#servicios"],["Cobertura","#cobertura"],["Proceso","#proceso"],["FAQ","#faq"]].map(([label,href]) => (
              <a key={label} href={href} className="relative px-3 py-2 hover:text-slate-950 transition-colors duration-200 group">
                {label}
                <span className="absolute bottom-0.5 left-3 right-3 h-[1.5px] rounded-full bg-cyan-700 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="tel:+528128985846" className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 sm:inline-flex">
              <Phone size={15} />
              Llamar
            </a>
            <a href="https://wa.me/528128985846" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-slate-800">
              <MessageCircle size={15} />
              WhatsApp
            </a>
            <button
              type="button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 lg:hidden"
            >
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`block h-[1.5px] w-5 rounded-full bg-slate-700 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
            {[
              ["Servicios", "#servicios"],
              ["Cobertura", "#cobertura"],
              ["Proceso", "#proceso"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                {label}
                <ArrowRight size={15} />
              </a>
            ))}
          </nav>
        )}
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_500px] lg:py-18">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              Servicio local profesional · respuesta el mismo día
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Agenda servicios confiables en tu zona sin vueltas ni llamadas eternas.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Página completa para negocios locales que necesitan generar confianza, explicar servicios, mostrar cobertura y convertir visitas en citas o cotizaciones.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="https://wa.me/528128985846" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-5 text-sm font-black text-white shadow-lg shadow-cyan-900/10 transition hover:bg-cyan-800">
                Cotizar por WhatsApp
                <ArrowRight size={16} />
              </a>
              <a href="#servicios" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
                Ver servicios
              </a>
            </div>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ["4.9/5", "calificación promedio"],
                ["2h", "respuesta inicial"],
                ["+1,200", "servicios completados"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="text-2xl font-black">{value}</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-2xl shadow-slate-950/10">
            <div className="rounded-lg bg-white p-5">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Agenda inteligente</p>
                  <h2 className="mt-2 text-2xl font-black">Solicitud de servicio</h2>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                  <CalendarCheck size={22} />
                </span>
              </div>

              <div className="grid gap-3">
                {[
                  ["Tipo", "Mantenimiento preventivo"],
                  ["Zona", "Monterrey / San Pedro"],
                  ["Horario", "Hoy · 4:30 PM"],
                  ["Prioridad", "Alta · negocio abierto"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
                    <span className="text-sm font-black text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
                <div className="mb-3 flex items-center gap-2 text-sm font-black">
                  <BadgeCheck size={16} className="text-emerald-300" />
                  Técnico confirmado
                </div>
                <p className="text-sm leading-6 text-white/62">
                  Este bloque puede convertirse en formulario real, calendario, cotizador o flujo de WhatsApp con datos del cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Servicios</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Oferta clara para vender más rápido</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Cada tarjeta es editable para cambiar giro, precio, cobertura, descripción y CTA según el negocio.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map(({ title, price, text, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Icon size={21} />
                </div>
                <h3 className="text-lg font-black leading-6">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-black text-cyan-700">{price}</span>
                  <a href="https://wa.me/528128985846" className="text-sm font-black text-slate-950 hover:text-cyan-700">Cotizar</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cobertura" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Cobertura</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Zonas atendidas con tiempos claros</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Ideal para negocios donde la ubicación importa: muestra colonias, ciudades, radios de atención, horarios y servicios express.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div key={zone} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <MapPin size={17} className="text-cyan-700" />
                <span className="font-black">{zone}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proceso" className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Proceso</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">De visita anónima a cita confirmada</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {process.map(([title, text], index) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 text-sm font-black text-slate-950">{index + 1}</div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Reseñas</p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Confianza antes del contacto</h2>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
              <Star size={16} fill="currentColor" />
              4.9 en atención local
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={15} fill="currentColor" />)}
                </div>
                <p className="text-sm leading-7 text-slate-600">{item.text}</p>
                <div className="mt-5">
                  <div className="font-black">{item.name}</div>
                  <div className="text-xs font-semibold text-slate-400">{item.role}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">FAQ</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Preguntas que reducen fricción</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Este bloque convierte dudas típicas en argumentos comerciales antes de que el usuario contacte.
            </p>
          </div>
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {faqs.map(([question, answer], index) => (
              <div key={question}>
                <button type="button" onClick={() => setOpenFaq((current) => current === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-black">
                  {question}
                  <ChevronDown size={17} className={`shrink-0 transition ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cyan-700 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Lista para adaptar</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
              Usa esta página como base real para cualquier negocio de servicios locales.
            </h2>
          </div>
          <Link href="/templates/servicios-locales" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-cyan-900 transition hover:bg-cyan-50">
            Activar esta página
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
