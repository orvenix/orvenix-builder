import Link from "next/link"
import Image from "next/image"
import type { CSSProperties } from "react"
import { ArrowRight, CreditCard, Edit3, Repeat } from "lucide-react"
import { selfEditTemplateAction } from "@/app/templates/actions"
import { MarketingLayout } from "@/components/marketing/MarketingLayout"
import { WEB_CATALOG } from "@/app/webs/catalog"
import { REAL_TEMPLATES } from "@/lib/realTemplates"

// Mapa de precios por ID — para mostrar precio en tarjeta sin repetir datos
const PRICE_MAP = Object.fromEntries(
  REAL_TEMPLATES.map(t => [t.id, { buy: t.purchasePriceMxn, rent: t.rentalPriceMxn }])
)

export default function WebsHub() {
  const categories = Array.from(new Set(WEB_CATALOG.map((app) => app.category)))
  const slugCategory = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const editableTemplateIds = new Set<string>(REAL_TEMPLATES.map((template) => template.id))
  const heroStats = [
    [String(WEB_CATALOG.length), "páginas reales"],
    ["10", "flujos activos"],
    [String(editableTemplateIds.size), "editables"],
  ]

  return (
    <MarketingLayout>
      <main className="webs-hub">
        <section className="webs-hero">
          <div className="webs-hero-copy">
            <div className="webs-eyebrow">
              <span aria-hidden="true" />
              Catálogo Orvenix · demos reales · listas para producción
            </div>
            <h1>
              Webs profesionales para activar, editar y escalar <span>sin perder tiempo.</span>
            </h1>
            <p>
              Explora experiencias completas por industria. Cada demo incluye estructura visual, componentes funcionales y flujos para editar, comprar o rentar dentro de tu cuenta.
            </p>
            <div className="webs-hero-actions">
              <a href="#catalogo" className="webs-primary-link">
                Ver catálogo
                <ArrowRight size={16} />
              </a>
              <Link href="/constructor" className="webs-secondary-link">
                Crear desde cero
              </Link>
            </div>
          </div>

          <aside className="webs-hero-panel" aria-label="Resumen del catálogo">
            {heroStats.map(([value, label]) => (
              <div key={label} className="webs-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </aside>
        </section>

        <section className="webs-toolbar" aria-label="Categorías disponibles">
          <div>
            <span className="webs-toolbar-label">Categorías</span>
            <h2>Encuentra la base visual adecuada</h2>
          </div>
          <div className="webs-category-row">
            {categories.map((category) => (
              <a key={category} href={`#${slugCategory(category)}`}>
                {category}
              </a>
            ))}
          </div>
        </section>

        <section id="catalogo" className="webs-grid" aria-label="Catálogo de webs">
          {WEB_CATALOG.map((app, i) => {
            const Icon = app.Icon
            const isEditableTemplate = editableTemplateIds.has(app.id)
            const price = PRICE_MAP[app.id]
            return (
              <article
                key={app.id}
                id={slugCategory(app.category)}
                className="webs-card"
                style={{ "--card-accent": app.accent } as CSSProperties}
              >
                <div className="webs-card-preview">
                  <Image
                    fill
                    unoptimized
                    src={`${app.preview}?w=800&h=440&fit=crop&crop=top&q=80&auto=format`}
                    alt={`Preview ${app.name}`}
                    className="object-cover object-top"
                    loading="lazy"
                  />

                  <div className="webs-browser-bar">
                    <div className="webs-window-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="webs-url">
                      <span>orvenix.com/{app.id}</span>
                    </div>
                    <span className="webs-live-dot" />
                  </div>

                  <span className="webs-category-badge">{app.category}</span>
                </div>

                <div className="webs-card-body">
                  <div className="webs-card-head">
                    <div>
                      <span>Plantilla #{String(i + 1).padStart(2, "0")}</span>
                      <h3>{app.name}</h3>
                    </div>
                    <div className={`webs-card-icon bg-linear-to-br ${app.gradient}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <p className="webs-description">{app.description}</p>

                  <div className="webs-features">
                    {app.features.map((feat) => (
                      <div key={feat}>
                        <span aria-hidden="true" />
                        {feat}
                      </div>
                    ))}
                  </div>

                  {/* Precio visible antes de los botones */}
                  {price && (
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 mb-3">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Compra única</p>
                        <p className="text-sm font-black text-white">
                          ${price.buy.toLocaleString("es-MX")}
                          <span className="ml-1 text-[10px] font-medium text-white/35">MXN</span>
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/[0.07]" />
                      <div className="flex-1 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Renta mensual</p>
                        <p className="text-sm font-black text-white">
                          ${price.rent.toLocaleString("es-MX")}
                          <span className="ml-1 text-[10px] font-medium text-white/35">/mes</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="webs-actions">
                    <Link
                      href={app.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="webs-demo-action"
                    >
                      Ver demo
                      <ArrowRight size={14} />
                    </Link>
                    {isEditableTemplate ? (
                      <>
                        <form action={selfEditTemplateAction.bind(null, app.id)}>
                          <button type="submit" className="webs-edit-action">
                            <Edit3 size={14} />
                            Editar
                          </button>
                        </form>
                        <Link href={`/checkout/start?templateId=${app.id}&intent=buy`} className="webs-buy-action">
                            <CreditCard size={14} />
                            Comprar
                        </Link>
                        <Link href={`/checkout/start?templateId=${app.id}&intent=rent`} className="webs-rent-action">
                            <Repeat size={14} />
                            Rentar
                        </Link>
                      </>
                    ) : (
                      <span className="webs-real-page-note">Página real</span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>
    </MarketingLayout>
  )
}
