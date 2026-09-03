"use client"

import { FilePenLine } from "lucide-react"

import { useEditorStore } from "@/store/useEditorStore"

import { HeroBusinessEditor } from "./editors/HeroBusinessEditor"
import { isHeroBusinessNode } from "./registry/hero-adapter-registry"

export function BusinessContentPanel() {
  const selectedNode = useEditorStore((state) =>
    state.selectedId
      ? state.tree.nodes[state.selectedId] ?? null
      : null,
  )

  if (
    selectedNode &&
    isHeroBusinessNode(selectedNode.type)
  ) {
    return <HeroBusinessEditor node={selectedNode} />
  }


  return (
  <section className="flex h-full flex-col items-center justify-center bg-[#091321] px-6 text-center text-slate-200">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
      <FilePenLine
        className="h-5 w-5"
        aria-hidden="true"
      />
    </span>

    <h2 className="mt-4 text-sm font-black text-white">
      Esta sección todavía no está conectada
    </h2>

    <p className="mt-2 max-w-[230px] text-xs leading-5 text-slate-500">
      Estamos preparando una edición sencilla para esta parte de tu página.
    </p>
  </section>
)
}
