"use client"

import { Plus, ShoppingBag, Trash2 } from "lucide-react"

import {
  COMMERCE_BRIEF_LIMITS_V1,
  commerceBriefFieldKeyV1,
  createCommerceProductDraftV1,
  createCommerceVariantDraftV1,
  type CommerceBriefDraftV1,
  type CommerceBriefErrorsV1,
  type CommerceBriefProductDraftV1,
  type CommerceBriefVariantDraftV1,
} from "@/lib/orvenix-ai/commerce/commerce-brief"

/**
 * COMMERCE-2B: compact Site Creation "commerce brief". Captures just enough
 * to create an initial store after confirmation -- not a catalog admin.
 * Visibility is UX only: the server re-checks the ecommerce entitlement at
 * preview AND at confirm, and re-normalizes every field.
 */

const INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[rgba(27,179,250,0.45)] aria-[invalid=true]:border-red-400/60"
const LABEL_CLASS = "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]"

type Props = {
  draft: CommerceBriefDraftV1
  errors: CommerceBriefErrorsV1
  available: boolean
  onChange: (next: CommerceBriefDraftV1) => void
}

/**
 * COMMERCE-2B safety: Enter inside ANY commerce-brief <input> (text fields
 * and the enable checkbox) must never trigger the parent Create Site form's
 * implicit submission (= a real Preview request). Buttons keep their native
 * Enter/Space activation, textareas (none today) would keep newlines, IME
 * composition is untouched, and nothing outside this editor is affected.
 */
export function shouldConsumeCommerceBriefEnterV1(event: { key: string; isComposing?: boolean; targetTagName?: string }): boolean {
  return event.key === "Enter" && !event.isComposing && event.targetTagName === "INPUT"
}

function consumeEnterFromInputs(event: React.KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement
  if (shouldConsumeCommerceBriefEnterV1({ key: event.key, isComposing: event.nativeEvent.isComposing, targetTagName: target.tagName })) {
    event.preventDefault()
  }
}

function fieldId(uiId: string, field: string) {
  return `commerce-${uiId}-${field}`
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} role="alert" className="mt-1 text-[11px] text-red-300">{message}</p>
}

function TextInput(props: {
  uiId: string
  field: string
  label: string
  value: string
  placeholder?: string
  errors: CommerceBriefErrorsV1
  inputMode?: "decimal" | "numeric" | "text"
  maxLength?: number
  prefix?: string
  onChange: (value: string) => void
}) {
  const id = fieldId(props.uiId, props.field)
  const error = props.errors[commerceBriefFieldKeyV1(props.uiId, props.field)]
  const errorId = `${id}-error`
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL_CLASS}>{props.label}</label>
      <div className="relative">
        {props.prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--text-muted)]">{props.prefix}</span>}
        <input
          id={id}
          value={props.value}
          inputMode={props.inputMode}
          maxLength={props.maxLength}
          placeholder={props.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => props.onChange(event.target.value)}
          className={`${INPUT_CLASS} ${props.prefix ? "pl-7" : ""}`}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

export function CommerceBriefEditor({ draft, errors, available, onChange }: Props) {
  const products = draft.products
  const atProductLimit = products.length >= COMMERCE_BRIEF_LIMITS_V1.maxProducts

  function setProducts(next: CommerceBriefProductDraftV1[]) {
    onChange({ ...draft, products: next })
  }

  function updateProduct(uiId: string, patch: Partial<CommerceBriefProductDraftV1>) {
    setProducts(products.map((product) => product.uiId === uiId ? { ...product, ...patch } : product))
  }

  function updateVariant(productUiId: string, variantUiId: string, patch: Partial<CommerceBriefVariantDraftV1>) {
    setProducts(products.map((product) => product.uiId !== productUiId ? product : {
      ...product,
      variants: product.variants.map((variant) => variant.uiId === variantUiId ? { ...variant, ...patch } : variant),
    }))
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]" onKeyDown={consumeEnterFromInputs}>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-3">
          <ShoppingBag size={16} className="mt-0.5 shrink-0 text-[color:var(--accent)]" aria-hidden />
          <div>
            <p id="commerce-brief-title" className="text-sm font-bold text-[color:var(--text)]">¿Venderás productos en este sitio?</p>
            <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">
              {available
                ? "Agrega tus productos con precio e inventario. Tu tienda y su carrito se crearán al confirmar el sitio."
                : "Tu plan actual no incluye tienda en línea. Puedes describir tus productos y se mostrarán como catálogo informativo."}
            </p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-[color:var(--text-secondary)]">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(event) => onChange({ ...draft, enabled: event.target.checked })}
            aria-describedby="commerce-brief-title"
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          Sí, vender productos
        </label>
      </div>

      {draft.enabled && (
        <div className="space-y-3 border-t border-white/[0.06] px-4 pb-4 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]" aria-live="polite">
              Productos: {products.length} / {COMMERCE_BRIEF_LIMITS_V1.maxProducts}
            </p>
            <button
              type="button"
              disabled={atProductLimit}
              onClick={() => setProducts([...products, createCommerceProductDraftV1()])}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs font-semibold text-[color:var(--accent)] transition-all hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={13} aria-hidden /> Agregar producto
            </button>
          </div>
          {errors.brief && <p role="alert" className="text-[11px] text-red-300">{errors.brief}</p>}
          <p className="text-[11px] leading-5 text-[color:var(--text-muted)]">
            Precios en MXN (ej. 5499.00). Inventario inicial: 0 = agotado, no disponible para compra. El SKU es opcional.
          </p>

          {products.map((product, productPosition) => (
            <fieldset key={product.uiId} className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-xs font-bold text-[color:var(--text)]">Producto {productPosition + 1}</legend>
                <button
                  type="button"
                  onClick={() => setProducts(products.filter((entry) => entry.uiId !== product.uiId))}
                  aria-label={`Eliminar producto ${productPosition + 1}${product.name.trim() ? ` (${product.name.trim()})` : ""}`}
                  className="grid h-8 w-8 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput uiId={product.uiId} field="name" label="Nombre" value={product.name} maxLength={COMMERCE_BRIEF_LIMITS_V1.maxNameLength} placeholder="Ej. Audífonos inalámbricos" errors={errors} onChange={(value) => updateProduct(product.uiId, { name: value })} />
                <TextInput uiId={product.uiId} field="category" label="Categoría (opcional)" value={product.category} maxLength={COMMERCE_BRIEF_LIMITS_V1.maxCategoryLength} placeholder="Ej. Audio" errors={errors} onChange={(value) => updateProduct(product.uiId, { category: value })} />
              </div>
              <TextInput uiId={product.uiId} field="description" label="Descripción (opcional)" value={product.description} maxLength={COMMERCE_BRIEF_LIMITS_V1.maxDescriptionLength} placeholder="Una frase breve" errors={errors} onChange={(value) => updateProduct(product.uiId, { description: value })} />
              <FieldError id={`${fieldId(product.uiId, "variants")}-error`} message={errors[commerceBriefFieldKeyV1(product.uiId, "variants")]} />

              <div className="space-y-2">
                {product.variants.map((variant, variantPosition) => (
                  <div key={variant.uiId} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-[color:var(--text-secondary)]">Variante {variantPosition + 1}</p>
                      {product.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => updateProduct(product.uiId, { variants: product.variants.filter((entry) => entry.uiId !== variant.uiId) })}
                          aria-label={`Eliminar variante ${variantPosition + 1} del producto ${productPosition + 1}`}
                          className="grid h-7 w-7 place-items-center rounded-lg text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={12} aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <TextInput uiId={variant.uiId} field="label" label="Variante" value={variant.label} maxLength={COMMERCE_BRIEF_LIMITS_V1.maxVariantLabelLength} placeholder="Única" errors={errors} onChange={(value) => updateVariant(product.uiId, variant.uiId, { label: value })} />
                      <TextInput uiId={variant.uiId} field="price" label="Precio (MXN)" value={variant.price} inputMode="decimal" prefix="$" placeholder="5499.00" errors={errors} onChange={(value) => updateVariant(product.uiId, variant.uiId, { price: value })} />
                      <TextInput uiId={variant.uiId} field="comparePrice" label="Precio anterior (opcional)" value={variant.comparePrice} inputMode="decimal" prefix="$" placeholder="6299.00" errors={errors} onChange={(value) => updateVariant(product.uiId, variant.uiId, { comparePrice: value })} />
                      <TextInput uiId={variant.uiId} field="initialStock" label="Inventario inicial" value={variant.initialStock} inputMode="numeric" placeholder="0" errors={errors} onChange={(value) => updateVariant(product.uiId, variant.uiId, { initialStock: value })} />
                      <TextInput uiId={variant.uiId} field="sku" label="SKU (opcional)" value={variant.sku} maxLength={COMMERCE_BRIEF_LIMITS_V1.maxSkuLength} placeholder="Se genera si lo dejas vacío" errors={errors} onChange={(value) => updateVariant(product.uiId, variant.uiId, { sku: value })} />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={product.variants.length >= COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct}
                  onClick={() => updateProduct(product.uiId, { variants: [...product.variants, createCommerceVariantDraftV1()] })}
                  className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-[color:var(--accent)] transition-all hover:bg-[rgba(27,179,250,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={12} aria-hidden /> Agregar variante ({product.variants.length} / {COMMERCE_BRIEF_LIMITS_V1.maxVariantsPerProduct})
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  )
}
