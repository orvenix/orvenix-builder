"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Globe2,
  Layout,
  Palette,
  Settings,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react"
import { useEffect, useState } from "react"

const DEMOS = [
  {
    eyebrow: "Template premium",
    brand: "Restaurante",
    title: "Reservas, menu y experiencia lista para vender.",
    text: "Una landing completa con secciones editables, CTA visible y estilo profesional desde el inicio.",
    cta: "Editar restaurante",
    accent: "#1BB3FA",
    mesh: "from-[#e9f8ff] via-[#ffffff] to-[#d8f0ff]",
  },
  {
    eyebrow: "Ecommerce",
    brand: "Tienda online",
    title: "Catalogo, productos y checkout con claridad comercial.",
    text: "El cliente parte de una estructura lista para cambiar imagenes, textos, precios y colecciones.",
    cta: "Personalizar tienda",
    accent: "#1794CC",
    mesh: "from-[#edf9ff] via-[#ffffff] to-[#cfeeff]",
  },
  {
    eyebrow: "Servicios",
    brand: "Clinica",
    title: "Confianza, citas y servicios explicados sin saturar.",
    text: "Diseño sobrio, secciones utiles y bloques pensados para convertir visitas en contactos.",
    cta: "Ajustar contenido",
    accent: "#1379A8",
    mesh: "from-[#f1fbff] via-[#ffffff] to-[#d7f2ff]",
  },
]

const EDITOR_PAGES = ["Inicio", "Servicios", "Precios", "Contacto"]
const TEMPLATE_CARDS = ["Hero", "Galeria", "Testimonios", "CTA"]

export function OrvenixBuilderShowcase() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % DEMOS.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [])

  const demo = DEMOS[active]

  return (
    <div className="orvenix-showcase relative mx-auto w-full max-w-[740px] select-none" aria-label="Vista premium del editor Orvenix">
      <div className="pointer-events-none absolute inset-8 rounded-[44px] bg-[#1BB3FA]/10 blur-3xl" />


      <div className="relative ml-auto mt-0 w-[94%] overflow-hidden rounded-[26px] border border-[#1BB3FA]/20 bg-[#07182a] shadow-[0_34px_100px_rgba(3,12,24,.52)]">
        <div className="flex h-12 items-center border-b border-white/[0.07] bg-[#061426] px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1BB3FA]/35" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#1794CC]/55" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#1BB3FA]" />
          </div>
          <div className="mx-auto rounded-lg border border-white/[0.05] bg-white/[0.035] px-4 py-1 text-[10px] font-semibold text-slate-400">
            editor.orvenix.com.mx
          </div>
          <div className="w-[42px]" />
        </div>

        <div className="flex min-h-[470px]">
          <aside className="hidden w-[164px] shrink-0 border-r border-white/[0.07] bg-[#091a2d] p-3 sm:block">
            <div className="mb-5 flex items-center gap-2 px-2 pt-1">
              <Image src="/img/logo-main.png" alt="Orvenix" width={94} height={30} className="h-auto w-[94px] object-contain" priority />
            </div>

            <MiniNav icon={<FileText size={13} />} label="Paginas" active />
            <MiniNav icon={<Layout size={13} />} label="Secciones" />
            <MiniNav icon={<Type size={13} />} label="Contenido" />
            <MiniNav icon={<Palette size={13} />} label="Marca" />
            <MiniNav icon={<Settings size={13} />} label="Ajustes" />

            <div className="mt-6 rounded-2xl border border-[#1BB3FA]/12 bg-[#0c2239] p-3">
              <p className="text-[9px] font-black uppercase text-[#8bdcff]">Sitio Pro</p>
              <div className="mt-3 space-y-1.5">
                {EDITOR_PAGES.map((item, index) => (
                  <div
                    key={item}
                    className={[
                      "rounded-lg px-2.5 py-2 text-[10px] transition-all duration-300",
                      index === active
                        ? "bg-[#1BB3FA]/13 font-bold text-[#b9ebff]"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="relative min-w-0 flex-1 overflow-hidden bg-[#0b2037] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#72d7ff]">Constructor visual</p>
                <p className="mt-1 text-xs text-slate-400">Edita textos, imagenes, estilos y secciones</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#1BB3FA]/18 bg-[#061426]/80 px-3 py-1.5 text-[10px] font-black text-[#b9ebff] sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                Guardado
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-dashed border-[#1BB3FA]/18 bg-[#061426]/54 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-[#1BB3FA]/10 px-3 py-1 text-[9px] font-black text-[#aee8ff]">Canvas</span>
                  <span className="text-[9px] font-bold text-slate-500">Desktop</span>
                </div>
                <div className="overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
                  <div className="flex h-9 items-center justify-between border-b border-slate-100 px-4">
                    <strong className="min-w-[88px] text-[10px] text-slate-900">{demo.brand}</strong>
                    <div className="hidden gap-3 text-[8px] font-bold text-slate-400 sm:flex">
                      <span>Inicio</span>
                      <span>Servicios</span>
                      <span>Comprar</span>
                    </div>
                  </div>
                  <div className={["relative min-h-[250px] overflow-hidden bg-gradient-to-br p-5 transition-colors duration-700", demo.mesh].join(" ")}>
                    <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#1BB3FA]/18 blur-2xl" />
                    <div className="absolute bottom-4 right-4 grid w-32 grid-cols-2 gap-2">
                      {TEMPLATE_CARDS.map((item, index) => (
                        <div key={item} className="rounded-xl border border-[#1379A8]/10 bg-white/78 p-2 shadow-lg shadow-sky-950/5 backdrop-blur">
                          <span className="block h-8 rounded-lg" style={{ background: index === active ? demo.accent : '#e5f6ff' }} />
                          <span className="mt-1.5 block text-[7px] font-black text-slate-500">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex min-h-[218px] max-w-[310px] flex-col items-start">
                      <span className="text-[8px] font-black uppercase tracking-[0.22em] text-[#1379A8]">{demo.eyebrow}</span>
                      <h3 className="mt-3 min-h-[108px] text-[26px] font-black leading-[1.04] text-slate-950 sm:text-[34px]">{demo.title}</h3>
                      <p className="mt-3 min-h-[60px] max-w-[245px] text-[10px] leading-5 text-slate-600">{demo.text}</p>
                      <div className="mt-auto inline-flex min-h-9 items-center rounded-xl bg-[#0A3E57] px-4 py-2 text-[9px] font-black text-white shadow-lg shadow-sky-950/20">
                        {demo.cta}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden space-y-3 md:block">
                <InsightCard icon={<Wand2 size={15} />} label="IA" value="Crea base editable" />
                <InsightCard icon={<BarChart3 size={15} />} label="Conversion" value="CTA visible" />
                <InsightCard icon={<Globe2 size={15} />} label="Publicacion" value="Enlace activo" />
                <div className="rounded-3xl border border-[#1BB3FA]/14 bg-[#061426]/62 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#72d7ff]">Paleta Orvenix</p>
                  <div className="mt-3 flex gap-2">
                    {["#1BB3FA", "#1794CC", "#1379A8", "#0E5C80", "#0A3E57"].map((color) => (
                      <span key={color} className="h-8 flex-1 rounded-xl shadow-inner" style={{ background: color }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="orvenix-showcase-tabs relative z-30 ml-auto mr-2 mt-4 grid w-[78%] grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.11] bg-[#07111f]/88 shadow-[0_24px_72px_rgba(0,0,0,.38)] backdrop-blur-xl max-sm:mx-auto max-sm:w-[92%]">
        {["Premium", "Editable", "Responsive"].map((item, index) => (
          <button
            key={item}
            type="button"
            onClick={() => setActive(index)}
            className={[
              "px-3 py-4 text-center text-[9px] font-black transition-all duration-300 sm:text-[10px]",
              active === index ? "bg-[#1BB3FA]/16 text-[#b9ebff]" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
            ].join(" ")}
          >
            {item}
          </button>
        ))}
      </div>


      <div className="relative z-30 mx-auto mt-6 flex w-fit items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-3 backdrop-blur">
        <Sparkles className="h-4 w-4 text-[#1BB3FA]" />
        <div>
          <p className="text-[11px] font-black text-white">Diseño Orvenix, no plantilla generica</p>
          <p className="mt-0.5 text-[9px] text-slate-500">El cliente cambia lo basico y publica con presencia premium.</p>
        </div>
        <CheckCircle2 className="ml-2 h-4 w-4 text-emerald-400" />
      </div>
    </div>
  )
}

function MiniNav({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={[
        "mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px]",
        active ? "bg-[#1BB3FA]/13 font-bold text-[#b9ebff]" : "text-slate-500",
      ].join(" ")}
    >
      {icon}
      {label}
    </div>
  )
}

function InsightCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#1BB3FA]/14 bg-[#061426]/62 p-4 shadow-xl shadow-black/10">
      <div className="flex items-center gap-2 text-[#72d7ff]">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  )
}
