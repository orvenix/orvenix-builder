"use client"

import { useCallback } from "react"
import { Building2, Mail, MessageCircle, Palette, Phone } from "lucide-react"

import { useEditorStore, type GlobalTheme } from "@/store/useEditorStore"

interface ClientBrandPanelProps {
  embedded?: boolean
  mode?: "basic" | "pro"
  focus?: "brand" | "design"
}

export function ClientBrandPanel({
  embedded = false,
  mode = "basic",
  focus = "brand",
}: ClientBrandPanelProps) {
  const isPro = mode === "pro"
  const brand = useEditorStore((state) => state.tree.brand)
  const theme =
    useEditorStore((state) => state.tree.globalTheme ?? state.tree.theme)
  const updateBrandKit = useEditorStore((state) => state.updateBrandKit)
  const execute = useEditorStore((state) => state.execute)

  const updateContact = useCallback(
    (
      key: "phone" | "whatsapp" | "email",
      value: string,
    ) => {
      updateBrandKit((currentBrand) => ({
        ...currentBrand,
        contact: {
          ...currentBrand.contact,
          [key]: value,
        },
      }))
    },
    [updateBrandKit],
  )

  const applyThemeColor = useCallback(
    (key: keyof GlobalTheme["colors"], value: string) => {
      execute(`apply-theme-color:${key}`, (draft) => {
        const theme = ensureTheme(draft.tree.theme ?? draft.tree.globalTheme)
        const nextColors = {
          ...theme.colors,
          [key]: value,
        }
        const nextTheme = {
          ...theme,
          colors: nextColors,
        }

        draft.tree.theme = nextTheme
        draft.tree.globalTheme = nextTheme
        applyPaletteToNodes(draft.tree.nodes, nextColors, theme.colors)
        draft.rev += 1
      })
    },
    [execute],
  )

  return (
    <aside className={[
  "flex h-full min-w-0 flex-col overflow-hidden bg-[#091321] text-slate-200",
  embedded
    ? "w-full"
    : "w-[320px] shrink-0 border-r border-white/[0.06]",
].join(" ")}>
      <header className="shrink-0 border-b border-white/[0.06] bg-[#0b1728] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400">
              Mi marca
            </p>

            <h2 className="mt-1 text-sm font-black text-white">
              {focus === "design" ? "Ajusta el estilo visual" : "Personaliza tu negocio"}
            </h2>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {focus !== "design" && (
          <PanelSection title="Empresa" icon={Building2}>
            <FieldLabel label="Nombre del negocio">
              <input
                type="text"
                value={brand?.businessName ?? ""}
                placeholder="Ej. Restaurante Don José"
                onChange={(event) =>
                  updateBrandKit({
                    businessName: event.target.value,
                  })
                }
                className={INPUT_CLASS}
              />
            </FieldLabel>

            {isPro && (
              <FieldLabel label="Logotipo">
                <input
                  type="url"
                  value={brand?.logoUrl ?? ""}
                  placeholder="URL del logotipo"
                  onChange={(event) =>
                    updateBrandKit({
                      logoUrl: event.target.value,
                    })
                  }
                  className={INPUT_CLASS}
                />
              </FieldLabel>
            )}
          </PanelSection>
        )}

        {focus !== "design" && <PanelSection title="Contacto" icon={Phone}>
          <FieldLabel label="Teléfono">
            <div className="relative">
              <Phone className={FIELD_ICON_CLASS} aria-hidden="true" />
              <input
                type="tel"
                value={brand?.contact?.phone ?? ""}
                placeholder="+52 55 0000 0000"
                onChange={(event) =>
                  updateContact("phone", event.target.value)
                }
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
          </FieldLabel>

          <FieldLabel label="WhatsApp">
            <div className="relative">
              <MessageCircle
                className={FIELD_ICON_CLASS}
                aria-hidden="true"
              />
              <input
                type="tel"
                value={brand?.contact?.whatsapp ?? ""}
                placeholder="525500000000"
                onChange={(event) =>
                  updateContact("whatsapp", event.target.value)
                }
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
          </FieldLabel>

          <FieldLabel label="Correo">
            <div className="relative">
              <Mail className={FIELD_ICON_CLASS} aria-hidden="true" />
              <input
                type="email"
                value={brand?.contact?.email ?? ""}
                placeholder="contacto@negocio.com"
                onChange={(event) =>
                  updateContact("email", event.target.value)
                }
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
          </FieldLabel>
        </PanelSection>}

        {isPro && <PanelSection title="Colores" icon={Palette}>
          <ColorField
            label="Principal"
            value={theme?.colors?.primary ?? "#315c57"}
            onChange={(primary) => applyThemeColor("primary", primary)}
          />

          <ColorField
            label="Secundario"
            value={theme?.colors?.secondary ?? "#28415e"}
            onChange={(secondary) => applyThemeColor("secondary", secondary)}
          />

          <ColorField
            label="Acento"
            value={theme?.colors?.accent ?? "#c48b5f"}
            onChange={(accent) => applyThemeColor("accent", accent)}
          />

          <ColorField
            label="Fondo"
            value={theme?.colors?.background ?? "#f8f6f1"}
            onChange={(background) => applyThemeColor("background", background)}
          />

          <ColorField
            label="Texto"
            value={theme?.colors?.text ?? "#1f2933"}
            onChange={(text) => applyThemeColor("text", text)}
          />
        </PanelSection>}

        {!isPro && focus !== "design" && (
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-3">
            <p className="text-xs font-bold text-cyan-100">Opciones esenciales</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">En modo básico dejamos solo marca y contacto. Pro desbloquea logotipo, colores y diseño avanzado.</p>
          </div>
        )}
      </div>
    </aside>
  )
}

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/35 focus:bg-white/[0.05]"

const FIELD_ICON_CLASS =
  "pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"

function PanelSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Building2
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.13em] text-slate-300">
          {title}
        </h3>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  )
}

function FieldLabel({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FieldLabel label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent p-1"
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={INPUT_CLASS}
        />
      </div>
    </FieldLabel>
  )
}

const DEFAULT_THEME: GlobalTheme = {
  colors: {
    primary: "#315c57",
    secondary: "#28415e",
    background: "#f8f6f1",
    text: "#1f2933",
    accent: "#c48b5f",
  },
  fontHeading: "system-ui, sans-serif",
  fontBody: "system-ui, sans-serif",
  spacing: {
    sectionX: "1.5rem",
    sectionY: "3rem",
    stack: "1.5rem",
  },
  radius: {
    card: "1rem",
    button: "999px",
  },
  shadow: {
    soft: "0 12px 32px rgba(15,23,42,0.08)",
    strong: "0 24px 60px rgba(15,23,42,0.18)",
  },
  motion: {
    duration: "240ms",
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
}

const PRIMARY_COLORS = new Set([
  "#315c57",
  "#244742",
  "#385953",
  "#4f6f68",
  "#00b5f6",
  "#00bbff",
])
const SECONDARY_COLORS = new Set(["#28415e", "#112540", "#183153", "#68736a"])
const ACCENT_COLORS = new Set(["#c48b5f", "#d6b287", "#9a8f73", "#f6a93b", "#22c55e"])
const TEXT_COLORS = new Set(["#1f2933", "#232522", "#24262f", "#0f172a", "#451a03"])
const MUTED_COLORS = new Set(["#626a72", "#646861", "#6c7280", "#8b9298", "#8f948c", "#475569"])
const LIGHT_TEXT_COLORS = new Set(["#ffffff", "#f8f6f1", "#ede8df", "#dbe7e4"])

function ensureTheme(theme?: Partial<GlobalTheme>): GlobalTheme {
  return {
    ...DEFAULT_THEME,
    ...theme,
    colors: {
      ...DEFAULT_THEME.colors,
      ...theme?.colors,
    },
    spacing: {
      ...DEFAULT_THEME.spacing,
      ...theme?.spacing,
    },
    radius: {
      ...DEFAULT_THEME.radius,
      ...theme?.radius,
    },
    shadow: {
      ...DEFAULT_THEME.shadow,
      ...theme?.shadow,
    },
    motion: {
      ...DEFAULT_THEME.motion,
      ...theme?.motion,
    },
  }
}

function normalizeColor(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function tint(hex: string, alpha: string) {
  return `${hex}${alpha}`
}

function applyPaletteToNodes(
  nodes: Record<string, { type: string; props: Record<string, unknown> }>,
  colors: GlobalTheme["colors"],
  previousColors: GlobalTheme["colors"],
) {
  Object.values(nodes).forEach((node) => {
    const props = node.props

    if (node.type === "heading" || node.type === "text") {
      const currentColor = normalizeColor(props.color)
      if (LIGHT_TEXT_COLORS.has(currentColor)) return
      if (PRIMARY_COLORS.has(currentColor) || currentColor === normalizeColor(previousColors.primary)) {
        props.color = colors.primary
      } else if (SECONDARY_COLORS.has(currentColor) || currentColor === normalizeColor(previousColors.secondary)) {
        props.color = colors.secondary
      } else if (ACCENT_COLORS.has(currentColor) || currentColor === normalizeColor(previousColors.accent)) {
        props.color = colors.accent
      } else if (TEXT_COLORS.has(currentColor) || MUTED_COLORS.has(currentColor) || currentColor === normalizeColor(previousColors.text)) {
        props.color = colors.text
      }
    }

    if (node.type === "section") {
      const background = normalizeColor(props.background)
      if (!background) return
      if (
        background.includes("#1f2933") ||
        background.includes("#28415e") ||
        background.includes("#112540") ||
        background.includes(normalizeColor(previousColors.primary)) ||
        background.includes(normalizeColor(previousColors.secondary))
      ) {
        props.background = `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`
      } else if (
        background.includes("#f8f6f1") ||
        background.includes("#ede8df") ||
        background.includes("#ffffff") ||
        background.includes("#f7f2ea") ||
        background.includes(normalizeColor(previousColors.background))
      ) {
        props.background = colors.background
      }
    }

    if (node.type === "genericWrapper") {
      const style = props.style
      if (!style || typeof style !== "object" || Array.isArray(style)) return
      const mutableStyle = style as Record<string, unknown>
      const borderColor = normalizeColor(mutableStyle.borderColor)
      const background = normalizeColor(mutableStyle.background)

      if (borderColor) {
        mutableStyle.borderColor = tint(colors.primary, "33")
      }
      if (background.includes("#ffffff") || background.includes("#f8f6f1")) {
        mutableStyle.background = "rgba(255,255,255,0.72)"
      } else if (
        background.includes("#ede8df") ||
        background.includes("#f7f2ea") ||
        background.includes(normalizeColor(previousColors.background))
      ) {
        mutableStyle.background = tint(colors.background, "dd")
      } else if (
        background.includes("#315c57") ||
        background.includes("#c48b5f") ||
        background.includes(normalizeColor(previousColors.primary)) ||
        background.includes(normalizeColor(previousColors.accent))
      ) {
        mutableStyle.background = `linear-gradient(135deg, ${tint(colors.primary, "18")}, ${tint(colors.accent, "18")})`
      }
    }
  })
}
