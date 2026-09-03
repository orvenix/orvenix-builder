"use client"

import { useMemo } from "react"
import { Megaphone, MousePointerClick, Type } from "lucide-react"

import { useEditorStore } from "@/store/useEditorStore"
import type { EditorNode } from "@/types/editor"

import { getHeroBusinessAdapter } from "../registry/hero-adapter-registry"
import type { HeroBusinessContent } from "../types"

interface HeroBusinessEditorProps {
  node: EditorNode
}

export function HeroBusinessEditor({
  node,
}: HeroBusinessEditorProps) {
  const updateNodeProps = useEditorStore(
    (state) => state.updateNodeProps,
  )

  const adapter = useMemo(
    () => getHeroBusinessAdapter(node.type),
    [node.type],
  )

  if (!adapter) {
    return null
  }

  const content = adapter.read(node)

  const updateContent = (
    patch: Partial<HeroBusinessContent>,
  ) => {
    const nextContent: HeroBusinessContent = {
      ...content,
      ...patch,
    }

    updateNodeProps(
      node.id,
      adapter.write(node.props, nextContent),
    )
  }

  return (
    <section className="flex h-full flex-col bg-[#091321] text-slate-200">
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0b1728] px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
          Contenido
        </p>

        <h2 className="mt-1 text-sm font-black text-white">
          Presentación principal
        </h2>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Cambia el mensaje principal que verá tu cliente al entrar.
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {content.eyebrow !== undefined && (
          <BusinessField
            label="Etiqueta superior"
            icon={Megaphone}
          >
            <input
              type="text"
              value={content.eyebrow}
              onChange={(event) =>
                updateContent({
                  eyebrow: event.target.value,
                })
              }
              className={INPUT_CLASS}
            />
          </BusinessField>
        )}

        <BusinessField
          label="¿Cómo quieres presentarte?"
          icon={Type}
        >
          <textarea
            value={content.title}
            rows={3}
            onChange={(event) =>
              updateContent({
                title: event.target.value,
              })
            }
            className={TEXTAREA_CLASS}
          />
        </BusinessField>

        <BusinessField
          label="Describe brevemente lo que haces"
          icon={Type}
        >
          <textarea
            value={content.subtitle ?? ""}
            rows={4}
            onChange={(event) =>
              updateContent({
                subtitle: event.target.value,
              })
            }
            className={TEXTAREA_CLASS}
          />
        </BusinessField>

        {content.primaryButton !== undefined && (
          <BusinessField
            label="Botón principal"
            icon={MousePointerClick}
          >
            <input
              type="text"
              value={content.primaryButton}
              onChange={(event) =>
                updateContent({
                  primaryButton: event.target.value,
                })
              }
              className={INPUT_CLASS}
            />
          </BusinessField>
        )}

        {content.secondaryButton !== undefined && (
          <BusinessField
            label="Botón secundario"
            icon={MousePointerClick}
          >
            <input
              type="text"
              value={content.secondaryButton}
              onChange={(event) =>
                updateContent({
                  secondaryButton: event.target.value,
                })
              }
              className={INPUT_CLASS}
            />
          </BusinessField>
        )}
      </div>
    </section>
  )
}

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/35 focus:bg-white/[0.05]"

const TEXTAREA_CLASS =
  `${INPUT_CLASS} min-h-[88px] resize-y leading-5`

function BusinessField({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: typeof Type
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        <Icon
          className="h-3.5 w-3.5 text-cyan-400"
          aria-hidden="true"
        />
        {label}
      </span>

      {children}
    </label>
  )
}
