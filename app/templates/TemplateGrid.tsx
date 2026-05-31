"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, ArrowRight, CreditCard, Edit3, Repeat, CheckCircle } from "lucide-react"
import { REAL_TEMPLATES } from "@/lib/realTemplates"
import { selfEditTemplateAction } from "./actions"

const CATEGORIES = ["Todos", ...Array.from(new Set(REAL_TEMPLATES.map(t => t.category)))]

export function TemplateGrid() {
  const [activeCategory, setActiveCategory] = useState("Todos")

  const visible = activeCategory === "Todos"
    ? REAL_TEMPLATES
    : REAL_TEMPLATES.filter(t => t.category === activeCategory)

  return (
    <>
      {/* Filtros interactivos */}
      <div className="mb-10 flex flex-wrap gap-2 justify-center">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
              activeCategory === cat
                ? "bg-cyan-500 border-cyan-400 text-black"
                : "border-white/[0.10] text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {cat}
            {activeCategory === cat && (
              <span className="ml-1.5 text-black/60">({visible.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((template, index) => {
          const Icon = template.Icon
          return (
            <article
              key={template.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.16] hover:bg-white/[0.04] hover:shadow-2xl"
              style={{ "--card-accent": template.accent } as CSSProperties}
            >
              {/* Preview */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  fill
                  unoptimized
                  src={template.preview}
                  alt={`Preview ${template.name}`}
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/20 to-transparent" />

                {/* Browser bar */}
                <div className="absolute left-3 right-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-red-400/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 flex-1 truncate text-[10px] font-medium text-white/40">
                    orvenix.com/webs/{template.id}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <span
                  className="absolute bottom-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ borderColor: `${template.accent}40`, backgroundColor: `${template.accent}18`, color: template.accent }}
                >
                  {template.category}
                </span>

                <span className="absolute bottom-3 right-3 text-4xl font-black text-white/[0.06] select-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black leading-tight text-white">{template.name}</h2>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${template.gradient} shadow-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <p className="mb-4 text-sm leading-6 text-white/40 line-clamp-3">{template.description}</p>

                {/* Features */}
                <div className="mb-5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {template.features.slice(0, 6).map(feature => (
                    <div key={feature} className="flex items-center gap-1.5 text-xs text-white/40">
                      <CheckCircle size={11} style={{ color: template.accent }} className="shrink-0" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Precios prominentes */}
                <div className="mb-5 rounded-xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
                  <div className="flex">
                    <div className="flex-1 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Compra única</p>
                      <p className="text-xl font-black text-white">
                        ${template.purchasePriceMxn.toLocaleString("es-MX")}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">tuyo para siempre</p>
                    </div>
                    <div className="w-px bg-white/[0.06]" />
                    <div className="flex-1 px-4 py-3 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Renta mensual</p>
                      <p className="text-xl font-black text-white">
                        ${template.rentalPriceMxn.toLocaleString("es-MX")}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">cancela cuando quieras</p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-auto flex flex-wrap gap-2 mb-2">
                  <Link
                    href={`/templates/${template.id}`}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Ver detalle
                    <ArrowUpRight size={13} />
                  </Link>
                  <Link
                    href={template.livePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition hover:opacity-80"
                    style={{ borderColor: `${template.accent}35`, backgroundColor: `${template.accent}12`, color: template.accent }}
                  >
                    Demo
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="flex gap-2">
                  <form action={selfEditTemplateAction.bind(null, template.id)} className="flex-1">
                    <button type="submit" className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500">
                      <Edit3 size={12} />
                      Editar gratis
                    </button>
                  </form>
                  <Link href={`/checkout/start?templateId=${template.id}&intent=buy`} className="flex-1">
                    <span className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500">
                      <CreditCard size={12} />
                      Comprar
                    </span>
                  </Link>
                  <Link href={`/checkout/start?templateId=${template.id}&intent=rent`} className="flex-1">
                    <span className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/15">
                      <Repeat size={12} />
                      Rentar
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <p className="text-lg font-semibold">Sin templates en esta categoría aún</p>
          <p className="text-sm mt-2">Pronto agregaremos más verticales</p>
        </div>
      )}
    </>
  )
}
