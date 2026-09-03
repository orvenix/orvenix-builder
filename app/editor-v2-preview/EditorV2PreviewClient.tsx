"use client"

import dynamic from "next/dynamic"

const SimpleEditorLayout = dynamic(
  () =>
    import("@/components/editor/simple-ui/SimpleEditorLayout").then(
      (module) => module.SimpleEditorLayout,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Cargando Orvenix Studio...
      </main>
    ),
  },
)

export function EditorV2PreviewClient() {
  return <SimpleEditorLayout />
}
