import type { ReactNode } from "react"

interface EditorPanelProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function EditorPanel({
  title,
  description,
  children,
  className = "",
}: EditorPanelProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-800 bg-slate-950/95 shadow-xl",
        className,
      ].join(" ")}
    >
      {(title || description) && (
        <header className="border-b border-slate-800 px-4 py-3">
          {title && (
            <h2 className="text-sm font-bold text-slate-100">{title}</h2>
          )}

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {description}
            </p>
          )}
        </header>
      )}

      <div className="p-4">{children}</div>
    </section>
  )
}
