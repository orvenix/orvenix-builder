"use client"

import {
  Check,
  ChevronDown,
  Eye,
  LoaderCircle,
  MoreHorizontal,
  Rocket,
  RotateCcw,
} from "lucide-react"

import { EditorButton } from "./EditorButton"

export type SimpleEditorSaveStatus =
  | "saved"
  | "saving"
  | "unsaved"

interface SimpleTopBarProps {
  projectName?: string
  saveStatus?: SimpleEditorSaveStatus
  canReset?: boolean
  onReset?: () => void
}

function SaveStatus({
  status,
}: {
  status: SimpleEditorSaveStatus
}) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
        <LoaderCircle
          className="h-3.5 w-3.5 animate-spin"
          aria-hidden="true"
        />
        Guardando...
      </span>
    )
  }

  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
        <span
          className="h-2 w-2 rounded-full bg-amber-400"
          aria-hidden="true"
        />
        Cambios pendientes
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/10">
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
      Todo guardado
    </span>
  )
}

export function SimpleTopBar({
  projectName = "Mi sitio web",
  saveStatus = "saved",
  canReset = false,
  onReset,
}: SimpleTopBarProps) {
  return (
    <header className="relative z-40 grid h-[68px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-slate-800/80 bg-slate-950 px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-black text-white shadow-lg shadow-sky-950/30">
          O
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Orvenix
          </p>

          <button
            type="button"
            className="mt-0.5 flex max-w-64 items-center gap-1.5 text-left text-sm font-bold text-slate-100 transition hover:text-white"
            title="Opciones del proyecto"
          >
            <span className="truncate">{projectName}</span>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 text-slate-500"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="justify-self-center">
        <SaveStatus status={saveStatus} />
      </div>

      <div className="flex items-center justify-self-end gap-2">
        <details className="relative">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white [&::-webkit-details-marker]:hidden"
            aria-label="Más acciones"
            title="Más acciones"
          >
            <MoreHorizontal className="h-5 w-5" />
          </summary>

          <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
            <button
              type="button"
              disabled={!canReset}
              onClick={onReset}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer página
            </button>
          </div>
        </details>

        <EditorButton variant="ghost">
          <Eye className="h-4 w-4" aria-hidden="true" />
          Vista previa
        </EditorButton>

        <EditorButton variant="primary">
          <Rocket className="h-4 w-4" aria-hidden="true" />
          Publicar
        </EditorButton>
      </div>
    </header>
  )
}
