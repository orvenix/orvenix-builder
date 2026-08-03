"use client"

import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"

import { SIMPLE_SECTION_LIBRARY } from "./section-library"
import type {
  SimpleEditorSectionDefinition,
  SimpleSectionCategory,
} from "./section-model"

interface SimpleBlockLibraryProps {
  open: boolean
  onClose: () => void
  onInsert: (definition: SimpleEditorSectionDefinition) => void
}

const CATEGORY_LABELS: Record<
  "all" | SimpleSectionCategory,
  string
> = {
  all: "Todos",
  essential: "Esenciales",
  business: "Negocio",
  store: "Tienda",
  content: "Contenido",
  contact: "Contacto",
}

export function SimpleBlockLibrary({
  open,
  onClose,
  onInsert,
}: SimpleBlockLibraryProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] =
    useState<"all" | SimpleSectionCategory>("all")

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return SIMPLE_SECTION_LIBRARY.filter((section) => {
      const matchesCategory =
        category === "all" || section.category === category

      const matchesQuery =
        !normalizedQuery ||
        section.name.toLowerCase().includes(normalizedQuery) ||
        section.description.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-library-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              Biblioteca
            </p>

            <h2
              id="block-library-title"
              className="mt-2 text-2xl font-black text-white"
            >
              ¿Qué quieres agregar?
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Elige un bloque y personalízalo desde el panel derecho.
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar biblioteca"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-slate-800 px-6 py-4">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />

            <input
              autoFocus
              value={query}
              placeholder="Buscar portada, galería, contacto..."
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => {
              const active = category === id

              return (
                <button
                  key={id}
                  type="button"
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    active
                      ? "bg-sky-500 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white",
                  ].join(" ")}
                  onClick={() =>
                    setCategory(
                      id as "all" | SimpleSectionCategory,
                    )
                  }
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          {filteredSections.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSections.map((section) => {
                const Icon = section.icon

                return (
                  <button
                    key={section.id}
                    type="button"
                    className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-500 hover:bg-slate-800"
                    onClick={() => onInsert(section)}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 transition group-hover:bg-sky-500 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <span className="mt-5 block text-base font-black text-white">
                      {section.name}
                    </span>

                    <span className="mt-2 block text-sm leading-relaxed text-slate-400">
                      {section.description}
                    </span>

                    <span className="mt-5 block text-xs font-bold text-cyan-400">
                      Agregar bloque →
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-bold text-slate-200">
                No encontramos ese bloque
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otra palabra o categoría.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
