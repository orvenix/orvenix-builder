import type { SectionRole } from "@/lib/orvenix-ai/architect"
import type {
  ComposedNode,
  ComposedSection,
  SectionCompositionContext,
} from "./types"
import { createComposedNode } from "./node-factory"
import { getPageAwareHeroCopy } from "@/lib/orvenix-ai/content/content-engine"
import { hasSafeContrast, lightAccentTint } from "@/lib/orvenix-ai/theme/visual-direction"
import { selectVariant, stableHash } from "./variant-selector"
import {
  CTA_VARIANTS,
  CTA_WEIGHTS,
  FEATURES_VARIANTS,
  FEATURES_WEIGHTS,
  HERO_TREATMENTS,
  HERO_TREATMENT_WEIGHTS,
  HERO_VARIANTS,
  HERO_WEIGHTS,
  NAVIGATION_CONTAINMENTS,
  NAVIGATION_CTA_EMPHASES,
  NAVIGATION_LINK_STYLES,
  NAVIGATION_SURFACE_STYLES,
  PREMIUM_COMPOSITION_TREATMENTS,
  PRICING_TREATMENTS,
  PROCESS_VARIANTS,
  PROCESS_WEIGHTS,
  SECTION_TONE_POOLS,
  SECTION_TONE_STRATEGIES,
  BOOKING_PRESENTATIONS,
  TESTIMONIAL_TREATMENTS,
  TRUST_TREATMENTS,
  SERVICES_VARIANTS,
  SERVICES_WEIGHTS,
  TRUST_VARIANTS,
  TRUST_WEIGHTS,
  TWO_ITEM_LAYOUT_VARIANTS,
  TWO_ITEM_LAYOUT_WEIGHTS,
  type PremiumCompositionTreatment,
  type SectionInstanceAlignment,
  type SectionTone,
} from "./composition-context"
import { visualLayoutMirrorsContent, visualLayoutToSiteNavLayout } from "./visual-layout-plan"
import {
  executableVariantForProductV1,
  isExecutableCommerceProductV1,
  presentationPriceLineV1,
  type CommerceProductFactV1,
} from "@/lib/orvenix-ai/commerce/product-facts"
import { formatProvisioningRefV1 } from "@/lib/orvenix-ai/commerce/provisioning-plan"
import { SECTION_INSTANCE_PAGE_HREF_PATTERN, type SectionInstanceCtaLabel } from "@/lib/orvenix-ai/architect/composition-plan"
import {
  resolveCtaCopy,
  resolveFeatureItems,
  resolveProcessIntro,
  resolveTrustItems,
} from "./semantic-copy"

function add(
  nodes: Record<string, ComposedNode>,
  node: ComposedNode,
) {
  nodes[node.tempId] = node
  return node.tempId
}

const DARK_ON_LIGHT_TEXT = { heading: "#0f172a", body: "#475569" }
const LIGHT_ON_DARK_TEXT = { heading: "#ffffff", body: "#e2e8f0" }

/**
 * V2-3.1: generic light/dark foreground pairing for a composer-chosen
 * section background. Reuses the already-tested contrast check from
 * theme/visual-direction.ts (V2-1) rather than building a new
 * accessibility engine. Any section content that sits DIRECTLY on the
 * section's own background (not inside its own opaque card) should
 * derive its text color from this instead of assuming a fixed
 * light-on-white palette -- the exact bug class that let a section
 * render dark-on-light-assuming text with no explicit background of its
 * own, silently falling through to Orvenix's own product-chrome dark
 * navy default instead of a color the generated site actually controls.
 */
function readableTextColorsFor(background: string): { heading: string; body: string } {
  return hasSafeContrast(DARK_ON_LIGHT_TEXT.heading, background) ? DARK_ON_LIGHT_TEXT : LIGHT_ON_DARK_TEXT
}

/**
 * V2-5B: background rhythm. Bounded tone tokens map to concrete
 * backgrounds; "contrast" is the only non-light one, and every caller
 * MUST derive its on-background text color from
 * readableTextColorsFor(resolveToneBackground(tone, context)) rather
 * than assuming light -- see composeCardGridSection and its row-based
 * layouts below. "accent-soft" is NOT in this static map -- it's
 * resolved dynamically (see resolveToneBackground) since it depends on
 * the caller's real theme accent when one is available.
 */
const TONE_BACKGROUNDS: Record<Exclude<SectionTone, "accent-soft">, string> = {
  base: "#ffffff",
  muted: "#f8fafc",
  contrast: "#0b1220",
}

/**
 * V2-5B refinement: no more fixed blue. When the caller supplies a real
 * resolved theme accent (context.accentColor), "accent-soft" is a
 * light tint of THAT color (lightAccentTint, theme/visual-direction.ts
 * -- reused, not duplicated). No accent color available -> the SAME
 * neutral gray-tinted surface "muted" already uses, never a
 * hardcoded/presumed hue. Every existing caller (no accentColor) gets
 * this neutral fallback -- their exact old #f0f7ff output is gone, but
 * that value was only ever reachable via richComposition:true, which
 * nothing before this feature ever set.
 */
const NEUTRAL_ACCENT_SOFT_FALLBACK = TONE_BACKGROUNDS.muted

function resolveToneBackground(tone: SectionTone, context: SectionCompositionContext): string {
  if (tone === "accent-soft") {
    const tint = context.accentColor ? lightAccentTint(context.accentColor) : null
    return tint ?? NEUTRAL_ACCENT_SOFT_FALLBACK
  }
  return TONE_BACKGROUNDS[tone]
}

/**
 * Deterministic, index-SENSITIVE on purpose (the opposite of
 * selectVariant, which deliberately excludes sectionIndex -- see its
 * own comment). Two sections of the same role on a page are rare, but
 * a page's sequence of DIFFERENT roles should not all flatten onto the
 * same white background; hashing sectionIndex in is what makes that
 * vary without being a mechanical index % 2 alternation. "contrast" is
 * intentionally rare in the default pool (a full tone-flip is a strong
 * visual move) and light tones dominate, since most sub-layouts assume
 * a light background unless explicitly made contrast-safe.
 *
 * V2-5C: which POOL gets hashed into is now selectable via a bounded
 * context.aiSectionToneStrategy (see SECTION_TONE_POOLS,
 * composition-context.ts) -- the Creative Director may name a
 * strategy, never a color/class. Absent/invalid strategy (or
 * richComposition off, enforced by the caller) resolves to "standard",
 * whose pool is byte-identical to V2-5B's original TONE_POOL, so
 * default output is unchanged.
 */
function resolveSectionTone(context: SectionCompositionContext, role: SectionRole): SectionTone {
  const strategy =
    context.aiSectionToneStrategy && (SECTION_TONE_STRATEGIES as readonly string[]).includes(context.aiSectionToneStrategy)
      ? context.aiSectionToneStrategy
      : "standard"
  const pool = SECTION_TONE_POOLS[strategy]
  const source = [role, context.visualFamily, context.archetype, String(context.sectionIndex ?? 0)].filter(Boolean).join("|")
  const hash = stableHash(source)
  return pool[hash % pool.length]
}

/**
 * V2-5B C5: shared by composeHero's abstract-glow treatment and
 * composeTrust's stats mode -- ONE implementation, never duplicated.
 * Renders ONLY when real, caller-supplied stats exist; returns null
 * otherwise (never fabricates a placeholder row). `value`/`label` are
 * rendered verbatim as already-trusted content -- this function never
 * invents, rounds, or appends units to them.
 */
function credibilityStatRow(
  nodes: Record<string, ComposedNode>,
  stats: Array<{ value: string; label: string }> | undefined,
  textColors: { heading: string; body: string },
): string | null {
  const usable = (stats ?? [])
    .map((s) => ({ value: s.value?.trim(), label: s.label?.trim() }))
    .filter((s): s is { value: string; label: string } => Boolean(s.value) && Boolean(s.label))
  if (usable.length === 0) return null

  const isDark = textColors.heading === "#ffffff"
  const badgeClassName = isDark
    ? "flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
    : "flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"

  const badges = usable.map((stat) => {
    const value = headingNode(nodes, `${stat.label} valor`, stat.value, 3, { size: "2xl", weight: "extrabold", align: "center", color: textColors.heading })
    const label = textNode(nodes, `${stat.label} etiqueta`, stat.label, { size: "sm", align: "center", color: textColors.body })
    return wrapperNode(nodes, `Estadistica ${stat.label}`, badgeClassName, [value, label])
  })

  return wrapperNode(nodes, "Fila de credibilidad", "grid grid-cols-2 gap-4 sm:grid-cols-4", badges)
}

function faqCopy(archetype: SectionCompositionContext["archetype"]) {
  if (archetype === "overview") {
    return {
      title: "Antes de que preguntes",
      intro:
        "Estas son las dudas que más nos comparten antes de dar el siguiente paso. Conoce el detalle completo en la página de servicios.",
      count: 2,
    }
  }

  if (archetype === "catalog") {
    return {
      title: "Preguntas frecuentes sobre nuestros servicios",
      intro:
        "Resolvemos las dudas más comunes sobre cada servicio antes de que tengas que preguntar.",
      count: 4,
    }
  }

  return {
    title: "Preguntas frecuentes",
    intro:
      "Resuelve aquí las dudas más comunes antes de que el cliente tenga que preguntar.",
    count: 4,
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const FAQ_SECTION_BACKGROUND = "#ffffff"

function composeFAQ(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const copy = faqCopy(context.archetype)
  const textColors = readableTextColorsFor(FAQ_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título FAQ",
      props: {
        text: copy.title,
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Introducción FAQ",
      props: {
        content: copy.intro,
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const items: string[] = []

  for (let index = 1; index <= copy.count; index++) {
    const question = add(
      nodes,
      createComposedNode({
        type: "heading",
        displayName: `Pregunta ${index}`,
        props: {
          text: `Pregunta frecuente ${index}`,
          level: 3,
          size: "lg",
        },
      }),
    )

    const answer = add(
      nodes,
      createComposedNode({
        type: "text",
        displayName: `Respuesta ${index}`,
        props: {
          content:
            "Agrega aquí una respuesta clara, breve y útil para el visitante.",
        },
      }),
    )

    const item = add(
      nodes,
      createComposedNode({
        type: "genericWrapper",
        displayName: `FAQ ${index}`,
        props: {
          tag: "article",
          className:
            "rounded-2xl border border-slate-200 bg-white p-5",
        },
        children: [question, answer],
      }),
    )

    items.push(item)
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Lista FAQ",
      props: {
        tag: "div",
        className: "grid gap-4 md:grid-cols-2",
      },
      children: items,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Preguntas frecuentes",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        align: "left",
        background: FAQ_SECTION_BACKGROUND,
      },
      children: [heading, intro, grid],
    }),
  )

  return {
    role: "faq",
    rootId: root,
    nodes,
    purpose: "Resolver objeciones y dudas frecuentes.",
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const GALLERY_SECTION_BACKGROUND = "#ffffff"

function composeGallery(context: SectionCompositionContext = {}): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const textColors = readableTextColorsFor(GALLERY_SECTION_BACKGROUND)

  /*
   * V2-6.2: FULL-BLEED MEDIA -- only reachable when a real, usable asset
   * exists (resolvedGalleryAssets, never fabricated). No usable asset ->
   * falls through to the existing grid gallery below exactly as before
   * ("Safe fallback when no media: fall back to another valid
   * composition, not fabricated imagery" -- the pre-existing, already-
   * proven grid IS that other valid composition, not a new empty
   * full-bleed block).
   */
  const fullBleedAssets = (context.resolvedGalleryAssets ?? []).filter((asset) => asset.src.trim())
  if (context.instanceVisualPrimitive === "full-bleed-media" && fullBleedAssets.length > 0) {
    const frame = fullBleedMediaBlock(nodes, {
      title: "Portafolio",
      caption: "Conoce nuestro trabajo",
      asset: fullBleedAssets[0],
      textColors,
    })
    const root = add(nodes, createComposedNode({ type: "section", displayName: "Galeria (full-bleed-media)", props: { maxWidth: "full", paddingY: "none", paddingX: "none", background: GALLERY_SECTION_BACKGROUND }, children: [frame] }))
    return { role: "gallery", rootId: root, nodes, purpose: "Mostrar trabajo real a pantalla completa." }
  }

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título galería",
      props: {
        text: "Conoce nuestro trabajo",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Descripción galería",
      props: {
        content: "Una muestra visual de nuestro trabajo y espacio.",
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const images: string[] = []

  const usableGalleryAssets = (context.resolvedGalleryAssets ?? []).filter((asset) => asset.src.trim())

  for (let index = 1; index <= 6; index++) {
    const asset = usableGalleryAssets[index - 1]
    const image = add(
      nodes,
      createComposedNode({
        type: "image",
        displayName: `Imagen galería ${index}`,
        props: {
          src: asset?.src ?? "",
          alt: asset?.alt ?? `Imagen del negocio ${index}`,
          objectFit: "cover",
          /*
           * V2-S1.1: real Pexels sources arrive with mixed intrinsic
           * aspect ratios (landscape/portrait). Without a fixed frame,
           * next/image's "h-auto" default lets each cell's height follow
           * the SOURCE photo's own ratio, so a portrait image renders far
           * taller than its landscape neighbors in the same grid row --
           * an irregular, broken-looking grid, independent of which
           * business/provider supplied the photo. `positionMode: "free"`
           * is the SAME existing mechanism the immersive hero variant
           * already uses to make an image fill an absolutely-sized
           * parent with cover (crop, never stretch) behavior; here the
           * parent is the fixed aspect-square cell wrapper below, not an
           * absolutely-positioned overlay -- same primitive, different
           * fixed frame. Source width/height metadata (asset provenance)
           * is never touched, only the CSS presentation.
           */
          positionMode: "free",
        },
      }),
    )
    const span = index === 1 ? "md:col-span-4 md:row-span-2" : index === 2 || index === 3 ? "md:col-span-2" : "md:col-span-2"
    images.push(
      wrapperNode(nodes, `Celda galería ${index}`, `relative aspect-square overflow-hidden rounded-xl bg-slate-100 ${span}`, [image]),
    )
  }

  const treatment = usableGalleryAssets.length > 0 ? premiumCompositionTreatment(context) : undefined
  const gridClassName = treatment === "bento" || treatment === "featured-asymmetric"
    ? "grid auto-rows-fr gap-4 md:grid-cols-6"
    : treatment === "media-led"
      ? "grid gap-4 md:grid-cols-[1.4fr_0.6fr]"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: treatment === "bento" || treatment === "featured-asymmetric" ? "Bento galería" : treatment === "media-led" ? "Media-led galería" : "Grid galería",
      props: {
        tag: "div",
        className: gridClassName,
      },
      children: images,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Galería",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: GALLERY_SECTION_BACKGROUND,
      },
      children: [heading, intro, grid],
    }),
  )

  return {
    role: "gallery",
    rootId: root,
    nodes,
    purpose:
      "Mostrar visualmente productos, espacios, trabajos o resultados.",
  }
}

/**
 * V2-3.1: trust is the only role composer that never set an explicit
 * section `background` -- every sibling (hero/services/features/contact/
 * cta/footer) already does. With no background of its own, the section
 * fell through to Orvenix's own product-chrome default (a dark navy --
 * see app/orvenix-tokens.css's --bg), while its heading/item text still
 * assumed a light background, producing unreadable dark-on-dark text.
 * Giving it the same kind of explicit background every other role
 * already has is the fix; readableTextColorsFor keeps the text correct
 * relative to whatever that background actually is, not a hardcoded
 * assumption, so this stays correct even if the chosen background ever
 * changes.
 */
const TRUST_SECTION_BACKGROUND = "#ffffff"

/**
 * V2-5B C5: credibility/stat presentation -- a SEPARATE, non-numeric-
 * safe mode of the existing "trust" role, gated behind
 * context.richComposition AND real context.credibilityStats (both
 * required; either absent falls straight through to the existing
 * checklist/card-grid trust treatment below, unchanged). Never called
 * when no real stats exist -- credibilityStatRow itself also refuses
 * to render a fabricated placeholder, so this is defense in depth, not
 * the only guard.
 */
function composeCredibilityStats(context: SectionCompositionContext, nodes: Record<string, ComposedNode>): ComposedSection | null {
  const textColors = readableTextColorsFor(TRUST_SECTION_BACKGROUND)
  const statRow = credibilityStatRow(nodes, context.credibilityStats, textColors)
  if (!statRow) return null

  const heading = headingNode(nodes, "Título confianza", "Razones para confiar", 2, { align: "center", color: textColors.heading })
  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Confianza (stats)",
      props: { maxWidth: "xl", paddingY: "lg", paddingX: "lg", background: TRUST_SECTION_BACKGROUND },
      children: [heading, statRow],
    }),
  )
  return { role: "trust", rootId: root, nodes, purpose: "Generar confianza con cifras reales, sin inventar estadisticas." }
}

function usableTrustPeople(context: SectionCompositionContext) {
  return (context.trustPeople ?? [])
    .map((person) => ({ name: person.name?.trim(), role: person.role?.trim(), detail: person.detail?.trim() }))
    .filter((person) => Boolean(person.name)) as Array<{ name: string; role?: string; detail?: string }>
}

function usableTrustOrganizations(context: SectionCompositionContext) {
  return (context.trustOrganizations ?? [])
    .map((organization) => ({ name: organization.name?.trim() }))
    .filter((organization): organization is { name: string } => Boolean(organization.name))
}

function usableTestimonials(context: SectionCompositionContext) {
  return (context.testimonials ?? [])
    .map((testimonial) => ({
      quote: testimonial.quote?.trim(),
      author: testimonial.author?.trim(),
      role: testimonial.role?.trim(),
      rating: testimonial.rating?.trim(),
    }))
    .filter((testimonial) => Boolean(testimonial.quote)) as Array<{ quote: string; author?: string; role?: string; rating?: string }>
}

function composePersonTrust(context: SectionCompositionContext, nodes: Record<string, ComposedNode>): ComposedSection | null {
  const people = usableTrustPeople(context)
  if (people.length === 0) return null

  const textColors = readableTextColorsFor(TRUST_SECTION_BACKGROUND)
  const heading = headingNode(nodes, "Título equipo", "Personas que te acompañan", 2, { align: "center", color: textColors.heading })
  const cards = people.slice(0, 3).map((person) => {
    const name = headingNode(nodes, person.name, person.name, 3, { size: "lg" })
    const role = person.role ? textNode(nodes, `${person.name} rol`, person.role, { size: "sm", weight: "bold", color: "#0369a1" }) : null
    const detail = person.detail ? textNode(nodes, `${person.name} detalle`, person.detail) : null
    return wrapperNode(nodes, `Persona ${person.name}`, "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", [name, ...(role ? [role] : []), ...(detail ? [detail] : [])], "article")
  })
  const grid = wrapperNode(nodes, "Grid personas confianza", "grid gap-4 md:grid-cols-3", cards)
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Confianza (personas)", props: { maxWidth: "xl", paddingY: "lg", paddingX: "lg", background: TRUST_SECTION_BACKGROUND }, children: [heading, grid] }))
  return { role: "trust", rootId: root, nodes, purpose: "Generar confianza con personas reales suministradas por el negocio." }
}

function composeOrganizationTrust(context: SectionCompositionContext, nodes: Record<string, ComposedNode>): ComposedSection | null {
  const organizations = usableTrustOrganizations(context)
  if (organizations.length === 0) return null

  const textColors = readableTextColorsFor(TRUST_SECTION_BACKGROUND)
  const heading = headingNode(nodes, "Título organizaciones", "Organizaciones relacionadas", 2, { align: "center", color: textColors.heading })
  const chips = organizations.slice(0, 6).map((organization) =>
    wrapperNode(nodes, `Organización ${organization.name}`, "flex min-h-20 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm", [textNode(nodes, organization.name, organization.name, { align: "center", weight: "bold" })]),
  )
  const strip = wrapperNode(nodes, "Strip organizaciones", "grid gap-3 sm:grid-cols-3 lg:grid-cols-6", chips)
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Confianza (organizaciones)", props: { maxWidth: "xl", paddingY: "lg", paddingX: "lg", background: TRUST_SECTION_BACKGROUND }, children: [heading, strip] }))
  return { role: "trust", rootId: root, nodes, purpose: "Mostrar organizaciones reales suministradas sin inventar logos ni afiliaciones." }
}

function composeTrust(context: SectionCompositionContext = {}): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

  if (context.richComposition) {
    const trustTreatment = context.aiPreferredTrustTreatment && (TRUST_TREATMENTS as readonly string[]).includes(context.aiPreferredTrustTreatment) ? context.aiPreferredTrustTreatment : undefined
    if (trustTreatment === "logo-strip") {
      const organizations = composeOrganizationTrust(context, nodes)
      if (organizations) return organizations
    }
    if (trustTreatment === "person-cards") {
      const people = composePersonTrust(context, nodes)
      if (people) return people
    }
    const stats = composeCredibilityStats(context, nodes)
    if (stats) return stats
  }

  const variant = selectVariant(context, "trust", TRUST_VARIANTS, TRUST_WEIGHTS)
  const textColors = readableTextColorsFor(TRUST_SECTION_BACKGROUND)

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título confianza",
      props: {
        text: "Razones para confiar",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const defaultItems: Array<[string, string]> = [
    /*
     * V2-S2.1 section B: these two bodies used to read as instructions
     * TO WHOEVER IS BUILDING the page ("explain here...", "describe how
     * you work...") rather than something a real visitor would ever
     * read on a live site -- found during real-copy E2E review. Neutral,
     * truthful, visitor-facing replacements: no guarantee/certification/
     * experience/result is claimed, since none was supplied. Item 3
     * ("Comunicación directa") is intentionally untouched -- only these
     * two were identified as live leaks in this pass.
     */
    ["Atención profesional", "Resolvemos tus dudas de forma clara y directa."],
    ["Proceso claro", "Sabrás en todo momento cuál es el siguiente paso."],
    ["Comunicación directa", "Muestra los canales reales de contacto y seguimiento."],
  ]

  /*
   * V2-S2 section 3: when the business supplied real services/products,
   * the first item names what's actually offered instead of staying
   * generic (bounded, no fabricated quality claim). No facts -> returns
   * `defaultItems` unchanged, so the V2-3.1-accepted no-facts render is
   * byte-identical to before.
   */
  const items = resolveTrustItems(context, defaultItems)

  let body: string

  if (variant === "checklist-row") {
    // Items sit directly on the section background (no card of their
    // own) -- they must follow the SAME derived colors as the heading.
    const rows = items.map(([title, text], index) => {
      const iconName = cardIconName("trust", index)
      const icon = iconName ? iconNode(nodes, `${title} ícono`, iconName) : null
      const iconWrap = wrapperNode(nodes, `${title} icono wrap`, "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700", icon ? [icon] : [])
      const cardTitle = headingNode(nodes, title, title, 3, { size: "md", weight: "bold", color: textColors.heading })
      const cardText = textNode(nodes, `${title} descripción`, text, { size: "sm", color: textColors.body })
      const textStack = wrapperNode(nodes, `${title} stack`, "flex flex-col gap-1", [cardTitle, cardText])
      return wrapperNode(nodes, title, "flex items-center gap-4", [iconWrap, textStack])
    })
    body = wrapperNode(nodes, "Checklist confianza", "grid gap-5 sm:grid-cols-3", rows)
  } else {
    // Cards impose their OWN opaque white background regardless of the
    // section's -- their text intentionally stays the fixed dark-on-white
    // default, not derived from TRUST_SECTION_BACKGROUND.
    const cards = items.map(([title, text], index) => {
      const iconName = cardIconName("trust", index)
      const icon = iconName ? iconNode(nodes, `${title} ícono`, iconName) : null
      const cardTitle = headingNode(nodes, title, title, 3, { size: "lg" })
      const cardText = textNode(nodes, `${title} descripción`, text)
      return wrapperNode(nodes, title, "rounded-2xl border border-slate-200 bg-white p-6", icon ? [icon, cardTitle, cardText] : [cardTitle, cardText], "article")
    })
    body = wrapperNode(nodes, "Grid confianza", "grid gap-4 md:grid-cols-3", cards)
  }

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: `Confianza (${variant})`,
      props: {
        maxWidth: "xl",
        paddingY: "lg",
        paddingX: "lg",
        background: TRUST_SECTION_BACKGROUND,
      },
      children: [heading, body],
    }),
  )

  return {
    role: "trust",
    rootId: root,
    nodes,
    purpose:
      "Generar confianza sin inventar testimonios ni estadísticas.",
  }
}

/** V2-3.1: same fix as trust -- this role never set an explicit section background either (see TRUST_SECTION_BACKGROUND's comment). */
const TESTIMONIALS_SECTION_BACKGROUND = "#ffffff"

function composeTestimonials(context: SectionCompositionContext = {}): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const textColors = readableTextColorsFor(TESTIMONIALS_SECTION_BACKGROUND)

  /*
   * V2-6.2: OVERSIZED TYPOGRAPHY testimonial -- one real, grounded quote
   * rendered as a bare typographic statement (no card grid, no stars/
   * ratings ever fabricated here regardless of primitive). Only the
   * FIRST usable real testimonial is used, exactly like a pull-quote;
   * falls through to the existing 3-card grid when no usable testimonial
   * exists (never invents one to fill the primitive).
   */
  const realTestimonialsForPrimitive = usableTestimonials(context)
  if (context.instanceVisualPrimitive === "oversized-typography" && realTestimonialsForPrimitive.length > 0) {
    const [testimonial] = realTestimonialsForPrimitive
    const attribution = [testimonial.author, testimonial.role].filter(Boolean).join(", ") || undefined
    const passage = oversizedTypographyPassage(nodes, {
      keyBase: "testimonio-tipografico",
      title: `"${testimonial.quote}"`,
      body: attribution,
      align: "center",
      headingSize: "6xl",
      textColors,
    })
    const root = add(nodes, createComposedNode({ type: "section", displayName: "Testimonios (oversized-typography)", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: TESTIMONIALS_SECTION_BACKGROUND }, children: [passage] }))
    return { role: "testimonials", rootId: root, nodes, purpose: "Presentar un testimonio real como declaracion tipografica." }
  }

  const heading = add(
    nodes,
    createComposedNode({
      type: "heading",
      displayName: "Título testimonios",
      props: {
        text: "Experiencias de clientes",
        level: 2,
        size: "3xl",
        align: "center",
        color: textColors.heading,
      },
    }),
  )

  const intro = add(
    nodes,
    createComposedNode({
      type: "text",
      displayName: "Descripción testimonios",
      props: {
        content:
          "Agrega aquí opiniones reales de clientes cuando estén disponibles.",
        align: "center",
        color: textColors.body,
      },
    }),
  )

  const cards: string[] = []
  const realTestimonials = usableTestimonials(context)
  const testimonialTreatment = context.aiPreferredTestimonialTreatment && (TESTIMONIAL_TREATMENTS as readonly string[]).includes(context.aiPreferredTestimonialTreatment) ? context.aiPreferredTestimonialTreatment : undefined

  /*
   * ASSISTED-4A finalization: real, caller-supplied testimonials are FACTS,
   * not a rich-composition styling choice -- they render whenever they
   * exist (previously only when a Creative Director rich field was set,
   * which showed placeholder cards INSTEAD of real evidence otherwise).
   * Rating display stays gated on the CD "rating-led" treatment. The
   * placeholder branch below remains only for direct/legacy composeSection
   * callers: the multi-page builder omits the role entirely when no real
   * testimonial exists (see omitUngroundedTestimonialSectionsV1).
   */
  if (realTestimonials.length > 0) {
    for (const [index, testimonial] of realTestimonials.slice(0, 3).entries()) {
      const rating = testimonialTreatment === "rating-led" && testimonial.rating ? textNode(nodes, `Rating testimonio ${index + 1}`, testimonial.rating, { size: "sm", weight: "bold", color: "#0369a1" }) : null
      const quote = textNode(nodes, `Testimonio ${index + 1}`, testimonial.quote)
      const author = testimonial.author ? headingNode(nodes, `Autor testimonio ${index + 1}`, testimonial.author, 3, { size: "sm" }) : null
      const role = testimonial.role ? textNode(nodes, `Rol testimonio ${index + 1}`, testimonial.role, { size: "sm" }) : null
      const card = wrapperNode(nodes, `Tarjeta testimonio ${index + 1}`, "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm", [ ...(rating ? [rating] : []), quote, ...(author ? [author] : []), ...(role ? [role] : []) ], "article")
      cards.push(card)
    }
  } else {

  for (let index = 1; index <= 3; index++) {
    const quote = add(
      nodes,
      createComposedNode({
        type: "text",
        displayName: `Testimonio ${index}`,
        props: {
          content:
            "Testimonio pendiente de contenido real.",
        },
      }),
    )

    const author = add(
      nodes,
      createComposedNode({
        type: "heading",
        displayName: `Autor testimonio ${index}`,
        props: {
          text: "Cliente",
          level: 3,
          size: "sm",
        },
      }),
    )

    const card = add(
      nodes,
      createComposedNode({
        type: "genericWrapper",
        displayName: `Tarjeta testimonio ${index}`,
        props: {
          tag: "article",
          className:
            "rounded-2xl border border-slate-200 bg-white p-6",
        },
        children: [
          quote,
          author,
        ],
      }),
    )

    cards.push(card)
  }
  }

  const grid = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Grid testimonios",
      props: {
        tag: "div",
        className:
          "grid gap-4 md:grid-cols-3",
      },
      children: cards,
    }),
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Testimonios",
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: TESTIMONIALS_SECTION_BACKGROUND,
      },
      children: [
        heading,
        intro,
        grid,
      ],
    }),
  )

  return {
    role: "testimonials",
    rootId: root,
    nodes,
    purpose:
      "Mostrar testimonios reales sin inventar opiniones ni identidades.",
  }
}

function textNode(nodes: Record<string, ComposedNode>, displayName: string, content: string, props: Record<string, unknown> = {}) {
  return add(nodes, createComposedNode({ type: "text", displayName, props: { content, color: "#475569", size: "md", ...props } }))
}

function headingNode(nodes: Record<string, ComposedNode>, displayName: string, value: string, level = 2, props: Record<string, unknown> = {}) {
  return add(nodes, createComposedNode({ type: "heading", displayName, props: { text: value, level, size: level === 1 ? "5xl" : "3xl", weight: "extrabold", color: "#0f172a", ...props } }))
}

function wrapperNode(nodes: Record<string, ComposedNode>, displayName: string, className: string, children: string[], tag = "div") {
  return add(nodes, createComposedNode({ type: "genericWrapper", displayName, props: { tag, className }, children }))
}

/**
 * V2-1: deterministic per-role icon sequences for generated-content
 * iconography. Values are names from the fixed, statically-imported
 * ICON_ALLOWLIST in components/editor/primitives/Icon.tsx -- this list
 * must stay in sync with that allowlist (an unrecognized name renders
 * nothing, it never executes arbitrary code, but it would silently show
 * no icon). Deliberately positional-by-index, not title-keyword-matched:
 * card titles for "services" can be real, business-supplied names (eg.
 * "Fisioterapia deportiva"), so a title-keyword dictionary would only
 * ever work for the generic fallback copy, not real business content.
 * Positional selection works identically for both.
 */
const CARD_ICON_SEQUENCE_BY_ROLE: Partial<Record<SectionRole, string[]>> = {
  trust: ["shield-check", "workflow", "message-circle"],
  services: ["sparkles", "check-circle", "star", "zap"],
  features: ["shield-check", "zap", "star"],
  process: ["list-checks", "workflow", "check-circle"],
}

function cardIconName(role: SectionRole, index: number): string | undefined {
  const sequence = CARD_ICON_SEQUENCE_BY_ROLE[role]
  if (!sequence || sequence.length === 0) return undefined
  return sequence[index % sequence.length]
}

function iconNode(nodes: Record<string, ComposedNode>, displayName: string, name: string) {
  return add(nodes, createComposedNode({ type: "icon", displayName, props: { name, size: 24 } }))
}

/**
 * V2-5C.1 Phase F: the header's light/dark color PAIRING is never an AI
 * choice -- it is derived deterministically from the SAME page-level
 * hero signals already validated/sanitized upstream (aiPreferredHeroTreatment/
 * aiPreferredHeroVariant, both already present in context for every
 * section on this page). A dark hero (abstract-glow treatment, or the
 * immersive variant's own dark gradient overlay) gets a dark-surfaced
 * header (light text, safe against a dark background); anything else
 * gets the light surface. This is the deterministic contrast safeguard
 * -- the AI never emits a hex color, a Tailwind class, or "dark"/"light"
 * directly; it only ever requests a STYLE (glass/solid, containment,
 * link style, CTA emphasis), and Orvenix alone resolves the safe pairing.
 */
function resolveNavigationSurface(context: SectionCompositionContext): "dark" | "light" {
  const heroIsDark = context.aiPreferredHeroTreatment === "abstract-glow" || context.aiPreferredHeroVariant === "immersive"
  return heroIsDark ? "dark" : "light"
}

function composeNavigation(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const pages = (context.sitePages ?? [])
    .map((page, index) => {
      const slug = page.slug.trim().toLowerCase()
      const label = page.name.trim() || slug

      return {
        label,
        name: label,
        slug,
        href: `page:${slug}`,
        isHome: page.isHome === true || (index === 0 && slug === "home"),
      }
    })
    .filter((page) => page.slug)

  /*
   * V2-5C.1: navigation richness activates ONLY when a validated
   * navigation-specific decision actually exists on THIS site's
   * CreativeDirection (site-level, so identical across every page --
   * see Phase N) -- deliberately NOT just "context.richComposition",
   * since richComposition can also be true purely because of an
   * unrelated hero/process/tone decision on this page, in which case
   * the header must stay byte-identical to its pre-V2-5C.1 output
   * (Phase K: "preserve old output when no navigation decision
   * exists"). Each override is defensively re-checked against its
   * composition-context.ts source-of-truth array, same pattern as
   * aiPreferredHeroVariant.
   */
  const navigationRichnessRequested = Boolean(
    context.richComposition &&
      (context.aiPreferredNavigationSurfaceStyle ||
        context.aiPreferredNavigationContainment ||
        context.aiPreferredNavigationLinkStyle ||
        context.aiPreferredNavigationCtaEmphasis),
  )

  const navigationSurfaceStyle =
    navigationRichnessRequested && context.aiPreferredNavigationSurfaceStyle && (NAVIGATION_SURFACE_STYLES as readonly string[]).includes(context.aiPreferredNavigationSurfaceStyle)
      ? context.aiPreferredNavigationSurfaceStyle
      : undefined
  const navigationContainment =
    navigationRichnessRequested && context.aiPreferredNavigationContainment && (NAVIGATION_CONTAINMENTS as readonly string[]).includes(context.aiPreferredNavigationContainment)
      ? context.aiPreferredNavigationContainment
      : undefined
  const navigationLinkStyle =
    navigationRichnessRequested && context.aiPreferredNavigationLinkStyle && (NAVIGATION_LINK_STYLES as readonly string[]).includes(context.aiPreferredNavigationLinkStyle)
      ? context.aiPreferredNavigationLinkStyle
      : "minimal"
  const navigationCtaEmphasis =
    navigationRichnessRequested && context.aiPreferredNavigationCtaEmphasis && (NAVIGATION_CTA_EMPHASES as readonly string[]).includes(context.aiPreferredNavigationCtaEmphasis)
      ? context.aiPreferredNavigationCtaEmphasis
      : "prominent"

  const navLayout = visualLayoutToSiteNavLayout(context.instanceVisualLayout)
  const layoutRequestsOverlay = navLayout === "overlay"
  const resolvedSurface = navigationRichnessRequested || layoutRequestsOverlay ? resolveNavigationSurface(context) : undefined

  /*
   * V2-5C.1 refinement: real brand identity + real theme accent are
   * UNCONDITIONAL (never gated behind navigationRichnessRequested) --
   * this mirrors composeFooter's own existing, already-shipped
   * `context.businessName?.trim() || "Nombre del negocio"` pattern
   * exactly (see composeFooter above), and reuses the SAME
   * context.accentColor every other richComposition-gated "accent-soft"
   * tone already reads (see resolveToneBackground) -- both are
   * Orvenix-owned, already-available, already-computed data, never a
   * Creative Director field. Executor-quality output (a real name, a
   * theme-coherent accent) should improve for every generated site, not
   * only ones where V2-5C.1's separate navigation TREATMENT selection
   * also happened to activate.
   */
  const brandName = context.businessName?.trim() || "Nombre del negocio"

  const root = add(nodes, createComposedNode({
    type: "siteNav",
    displayName: "Menu principal",
    props: {
      title: brandName,
      subtitle: "Sitio profesional",
      labelOverrides: pages.length
        ? pages.map((page) => `${page.slug}=${page.label}`).join("\n")
        : "home=Inicio\nservicios=Servicios\nproductos=Productos\nprecios=Precios\ncontacto=Contacto",
      ...(pages.length ? { pages } : {}),
      showHome: true,
      // COMMERCE-5B: an Orvenix-resolved action (or explicit omission) replaces the legacy "#contacto" anchor.
      showCta: navigationCtaEmphasis !== "none" && !context.instanceOmitCta,
      ctaLabel: context.commerceCtaAction?.label ?? "Contactar",
      ctaHref: context.commerceCtaAction?.href ?? "#contacto",
      layout: "row",
      justify: navLayout === "centered-editorial" ? "center" : navLayout === "split" ? "end" : "center",
      variant: navLayout === "centered-editorial" ? "minimal" : navigationLinkStyle,
      ...(navLayout ? { navLayout } : {}),
      ...(navLayout === "overlay" ? { chrome: "integrated" as const, surfaceStyle: "glass" as const } : navLayout && navLayout !== "classic" ? { chrome: "integrated" as const } : navigationContainment ? { chrome: navigationContainment } : {}),
      ...(navLayout === "overlay" ? {} : navigationSurfaceStyle ? { surfaceStyle: navigationSurfaceStyle } : {}),
      ...(resolvedSurface ? { surface: resolvedSurface } : {}),
      ...(context.accentColor ? { accent: context.accentColor } : {}),
    },
  }))
  return { role: "navigation", rootId: root, nodes, purpose: "Navegacion principal editable del sitio." }
}

/** Shared by composeHero's abstract-glow treatment: single CTA when there's nothing real for a secondary button to link to, dual otherwise. New code path only -- the 4 pre-existing HeroVariants keep their exact original always-dual behavior, unchanged. */
function resolveHeroCtaButtons(nodes: Record<string, ComposedNode>, context: SectionCompositionContext): string[] {
  /*
   * V2-6.1: a "typographic opening" CompositionPlan instance (emphasis
   * "opening") explicitly asks for no call-to-action -- oversized
   * typographic hierarchy and negative space only. Every existing caller
   * leaves instanceOmitCta unset, so this stays dead code for them.
   */
  if (context.instanceOmitCta) return []

  const primary = add(
    nodes,
    createComposedNode({ type: "ctaButton", displayName: "CTA principal", props: { label: "Solicitar informacion", href: "#contacto", variant: "primary", size: "lg" } }),
  )
  const hasSecondaryTarget = Boolean(context.services?.length) || Boolean(context.products?.length)
  if (!hasSecondaryTarget) return [primary]
  const secondary = add(
    nodes,
    createComposedNode({ type: "ctaButton", displayName: "CTA secundario", props: { label: "Ver servicios", href: "#servicios", variant: "secondary", size: "lg" } }),
  )
  return [primary, secondary]
}

function composeHero(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}

  const deterministicHeroCopy = getPageAwareHeroCopy({
    name: context.businessName,
    industry: context.industry,
    objective: context.businessObjective,
    location: context.location,
    audience: context.audience,
    visualFamily: context.visualFamily,
    services: context.services,
    products: context.products,
    page: {
      name: context.pageName,
      slug: context.pageSlug,
      purpose: context.pagePurpose,
      archetype: context.archetype,
    },
  })
  /*
   * V2-4 section 6/17: AI Hero copy is a TOP-TIER SUGGESTION, already
   * fact-validated/sanitized upstream (creative-direction.ts) before it
   * ever reaches this context -- title/description ONLY, never eyebrow
   * or CTA labels. Absent -> byte-identical to the V2-S3 deterministic
   * baseline (S3 remains the fallback authority, never weakened).
   */
  const heroCopy = {
    ...deterministicHeroCopy,
    title: context.aiHeroTitleSuggestion ?? deterministicHeroCopy.title,
    description: context.aiHeroDescriptionSuggestion ?? deterministicHeroCopy.description,
  }

  /*
   * V2-6.2: the "typographic opening" primitive -- deliberately NOT the
   * standard hero with its image slot emptied. No image node at all, no
   * split-column grid, no default 2-button CTA row unless explicitly
   * requested: one oversized ("7xl") heading, generous negative space,
   * a bare typographic block exactly like oversizedTypographyPassage
   * renders elsewhere, reused rather than re-implemented for hero.
   */
  if (context.instanceVisualPrimitive === "oversized-typography") {
    const passage = oversizedTypographyPassage(nodes, {
      keyBase: "hero-opening",
      eyebrow: heroCopy.eyebrow,
      title: heroCopy.title,
      body: heroCopy.description,
      align: "center",
      headingSize: "7xl",
      textColors: DARK_ON_LIGHT_TEXT,
    })
    const ctaButtons = context.instanceOmitCta ? [] : resolveHeroCtaButtons(nodes, context)
    const actions = ctaButtons.length ? wrapperNode(nodes, "Acciones hero", "mt-4 flex flex-col justify-center gap-3 sm:flex-row", ctaButtons) : null
    const content = wrapperNode(nodes, "Contenido apertura tipografica", "mx-auto flex max-w-4xl flex-col items-center gap-2 text-center", actions ? [passage, actions] : [passage])
    const root = add(nodes, createComposedNode({ type: "section", displayName: "Hero autonomo variante oversized-typography", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#ffffff" }, children: [content] }))
    return { role: "hero", rootId: root, nodes, purpose: "Apertura tipografica sin imagen dominante." }
  }

  /*
   * V2-5B C1: an ADDITIONAL, INDEPENDENT decision -- see HERO_TREATMENTS'
   * doc comment for why this isn't a 5th HeroVariant. Gated behind
   * context.richComposition (see its doc comment): every EXISTING
   * caller leaves this unset, so this whole branch is dead code for
   * them and the V2-3 variant flow below is reached byte-identically
   * to before. Only when it resolves to "abstract-glow" does
   * composition diverge.
   *
   * V2-5C: aiPreferredHeroTreatment overrides the weighted pick ONLY
   * when it's one of the actually-registered HERO_TREATMENTS -- same
   * defensive re-check pattern as aiPreferredHeroVariant below, even
   * though contract.ts already constrains it upstream.
   */
  const heroTreatment =
    context.aiPreferredHeroTreatment && (HERO_TREATMENTS as readonly string[]).includes(context.aiPreferredHeroTreatment)
      ? context.aiPreferredHeroTreatment
      : selectVariant(context, "hero-treatment", HERO_TREATMENTS, HERO_TREATMENT_WEIGHTS)

  if (context.richComposition && heroTreatment === "abstract-glow") {
    return composeAbstractGlowHero(context, nodes, heroCopy)
  }

  /*
   * V2-4 section 18: preferredHeroVariant overrides the deterministic
   * V2-3 selection ONLY when it's one of the actually-registered
   * HERO_VARIANTS -- schema validation upstream (contract.ts) already
   * constrains it to that exact set, but this defensive re-check costs
   * nothing and protects against any future drift between the two lists
   * (covered by a dedicated cross-module test).
   */
  const variant = (context.aiPreferredHeroVariant && (HERO_VARIANTS as readonly string[]).includes(context.aiPreferredHeroVariant))
    ? (context.aiPreferredHeroVariant as (typeof HERO_VARIANTS)[number])
    : selectVariant(context, "hero", HERO_VARIANTS, HERO_WEIGHTS)

  const centered = variant === "centered" || variant === "immersive"
  const immersive = variant === "immersive"
  const textColor = immersive ? "#ffffff" : undefined
  const eyebrowColor = immersive ? "#e0f2fe" : "#0E5C80"
  /*
   * V2-5B C2: immersive-photo content composition -- left or centered,
   * resolved independently of every other variant's alignment (which
   * stays exactly as before). New role tag ("hero-immersive-alignment")
   * so this can never collide with the existing "hero" selection hash.
   */
  const immersiveAlignment: "left" | "center" = immersive && context.richComposition
    ? selectVariant(context, "hero-immersive-alignment", ["left", "center"] as const, {
        health: { center: 3, left: 1 },
        hospitality: { center: 2, left: 2 },
        creative: { left: 3, center: 1 },
        commerce: { center: 2, left: 2 },
        professional: { center: 3, left: 1 },
      })
    : "center"
  const textAlign: "left" | "center" = immersive ? immersiveAlignment : centered ? "center" : "left"

  const eyebrow = textNode(
    nodes,
    "Etiqueta hero",
    heroCopy.eyebrow,
    {
      size: "sm",
      color: eyebrowColor,
      align: textAlign,
    },
  )

  const title = headingNode(
    nodes,
    "Titulo hero",
    heroCopy.title,
    1,
    {
      align: textAlign,
      ...(textColor ? { color: textColor } : {}),
    },
  )

  const copy = textNode(
    nodes,
    "Descripcion hero",
    heroCopy.description,
    {
      size: "lg",
      align: textAlign,
      ...(textColor ? { color: "#e2e8f0" } : {}),
    },
  )

  const primary = add(
    nodes,
    createComposedNode({
      type: "ctaButton",
      displayName: "CTA principal",
      props: {
        label: "Solicitar informacion",
        href: "#contacto",
        variant: "primary",
        size: "lg",
      },
    }),
  )

  const secondary = add(
    nodes,
    createComposedNode({
      type: "ctaButton",
      displayName: "CTA secundario",
      props: {
        label: "Ver servicios",
        href: "#servicios",
        variant: "secondary",
        size: "lg",
      },
    }),
  )

  const actions = wrapperNode(
    nodes,
    "Acciones hero",
    centered
      ? "flex flex-col justify-center gap-3 sm:flex-row"
      : "flex flex-col gap-3 sm:flex-row",
    [primary, secondary],
  )

  const image = add(
    nodes,
    createComposedNode({
      type: "image",
      displayName: "Imagen hero",
      props: {
        src: "",
        alt: "Imagen principal del negocio",
        objectFit: "cover",
        ...(immersive ? { positionMode: "free" } : {}),
      },
    }),
  )

  if (immersive) {
    /*
     * Full-bleed media with a permanent gradient scrim: text sits on the
     * solid CSS overlay layer, never directly on unpredictable photo
     * pixels, so readability holds whether or not the image actually
     * loads (src=="" until V2-2's asset resolution fills it -- see
     * autonomous/site-builder.ts). The bg-slate-900 on the media wrapper
     * itself is the safe fallback backdrop when there is no image at
     * all, so an unavailable provider never leaves a blank/broken gap.
     */
    const mediaLayer = wrapperNode(nodes, "Imagen inmersiva", "absolute inset-0 h-full w-full bg-slate-900", [image])
    const scrim = wrapperNode(nodes, "Overlay legibilidad", "absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10", [])
    const content = wrapperNode(
      nodes,
      "Contenido hero",
      immersiveAlignment === "left"
        ? "relative z-10 mx-auto flex min-h-[26rem] w-full max-w-5xl flex-col items-start justify-end gap-6 px-6 pb-4 text-left sm:min-h-[30rem]"
        : "relative z-10 mx-auto flex min-h-[26rem] w-full max-w-4xl flex-col items-center justify-end gap-6 px-4 pb-4 text-center sm:min-h-[30rem]",
      [eyebrow, title, copy, actions],
    )

    const root = add(
      nodes,
      createComposedNode({
        type: "section",
        displayName: "Hero autonomo variante inmersiva",
        props: {
          maxWidth: "full",
          paddingY: "none",
          paddingX: "none",
        },
        children: [wrapperNode(nodes, "Layout hero inmersivo", "relative w-full overflow-hidden", [mediaLayer, scrim, content])],
      }),
    )

    return {
      role: "hero",
      rootId: root,
      nodes,
      purpose: "Presentar promesa, confianza visual y accion principal.",
    }
  }

  const media = wrapperNode(
    nodes,
    "Visual hero",
    variant === "centered"
      ? "mx-auto w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-sky-100 bg-sky-50 p-3 shadow-2xl shadow-sky-900/10"
      : "overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-50 p-3 shadow-2xl shadow-sky-900/10",
    [image],
  )

  const content = wrapperNode(
    nodes,
    "Contenido hero",
    centered
      ? "mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 text-center"
      : "flex flex-col justify-center gap-6",
    [eyebrow, title, copy, actions],
  )

  let layoutChildren: string[]
  let layoutClassName: string

  if (variant === "split-left") {
    layoutChildren = [media, content]
    layoutClassName =
      "grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]"
  } else if (variant === "centered") {
    layoutChildren = [content, media]
    layoutClassName = "flex flex-col gap-12"
  } else {
    layoutChildren = [content, media]
    layoutClassName =
      "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
  }

  const layout = wrapperNode(
    nodes,
    "Layout hero",
    layoutClassName,
    layoutChildren,
  )

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: `Hero autonomo variante ${variant}`,
      props: {
        maxWidth: "xl",
        paddingY: "xl",
        paddingX: "lg",
        background: variant === "centered" ? "#ffffff" : "#f8fbff",
      },
      children: [layout],
    }),
  )

  return {
    role: "hero",
    rootId: root,
    nodes,
    purpose:
      "Presentar promesa, confianza visual y accion principal.",
  }
}

/**
 * V2-5B C1: abstract-glow hero -- the reusable GRAMMAR of the
 * ambient-dark reference family (strong display hierarchy, bounded
 * decorative glow shapes, no external image required), never their
 * literal JSX/classes/copy. Every decorative shape below is an empty,
 * non-interactive genericWrapper div (aria-hidden, pointer-events-none)
 * positioned with composer-authored Tailwind classes -- never
 * arbitrary CSS/className from AI, since there IS no AI in this
 * composition path. Business-category-independent: reached only via
 * HERO_TREATMENT_WEIGHTS' per-family bias, which (like every V2-3
 * weight table) never locks any family out of any treatment.
 */
function composeAbstractGlowHero(
  context: SectionCompositionContext,
  nodes: Record<string, ComposedNode>,
  heroCopy: { eyebrow: string; title: string; description: string },
): ComposedSection {
  const background = TONE_BACKGROUNDS.contrast
  const textColors = readableTextColorsFor(background)

  const glowOne = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Decoracion glow 1",
      props: {
        tag: "div",
        className: "pointer-events-none absolute -top-24 right-0 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-[110px]",
        "aria-hidden": "true",
      },
    }),
  )
  const glowTwo = add(
    nodes,
    createComposedNode({
      type: "genericWrapper",
      displayName: "Decoracion glow 2",
      props: {
        tag: "div",
        className: "pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-[100px]",
        "aria-hidden": "true",
      },
    }),
  )

  const eyebrow = textNode(nodes, "Etiqueta hero", heroCopy.eyebrow, { size: "sm", align: "center", color: textColors.body })
  const title = headingNode(nodes, "Titulo hero", heroCopy.title, 1, { align: "center", color: textColors.heading })
  const description = textNode(nodes, "Descripcion hero", heroCopy.description, { size: "lg", align: "center", color: textColors.body })
  const ctaButtons = resolveHeroCtaButtons(nodes, context)
  const actions = ctaButtons.length
    ? wrapperNode(nodes, "Acciones hero", "flex flex-col justify-center gap-3 sm:flex-row", ctaButtons)
    : null

  const statRow = credibilityStatRow(nodes, context.credibilityStats, textColors)

  const contentChildren = [eyebrow, title, description, actions, statRow].filter((id): id is string => Boolean(id))
  const content = wrapperNode(
    nodes,
    "Contenido hero",
    "relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center",
    contentChildren,
  )

  const layout = wrapperNode(nodes, "Layout hero abstracto", "relative isolate overflow-hidden", [glowOne, glowTwo, content])

  const root = add(
    nodes,
    createComposedNode({
      type: "section",
      displayName: "Hero autonomo variante abstract-glow",
      props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background },
      children: [layout],
    }),
  )

  return {
    role: "hero",
    rootId: root,
    nodes,
    purpose: "Presentar promesa, confianza visual y accion principal.",
  }
}

type CardGridCopy = {
  titleText: string
  introText: string
  items: Array<[string, string]>
}

/**
 * Archetype-specific copy for card-grid roles shared between an overview
 * page and a catalog page (eg. Home vs Servicios). Only overview/catalog
 * are keyed here: conversion pages rarely carry these roles, and when
 * they do the neutral legacy copy below is a fine default.
 */
const CARD_GRID_ARCHETYPE_COPY: Partial<Record<SectionRole, Record<"overview" | "catalog", CardGridCopy>>> = {
  services: {
    overview: {
      titleText: "Lo que hacemos por ti",
      introText: "Un vistazo rapido a como podemos ayudarte. Conoce el detalle completo en la pagina de servicios.",
      items: [["Atencion personalizada", "Resolvemos lo que necesitas con un proceso claro y directo."], ["Resultados medibles", "Nos enfocamos en el resultado que buscas, no solo en la tarea."]],
    },
    catalog: {
      titleText: "Nuestro catalogo de servicios",
      introText: "Explora cada servicio a detalle y encuentra el que mejor resuelve lo que buscas.",
      items: [["Diagnostico inicial", "Entendemos tu situacion antes de proponer cualquier solucion."], ["Plan a la medida", "Disenamos un plan especifico para tu caso, no una plantilla generica."], ["Seguimiento cercano", "Acompanamos cada etapa para asegurar el resultado esperado."], ["Entrega y cierre", "Cerramos el proceso con claridad sobre lo logrado y los siguientes pasos."]],
    },
  },
  features: {
    overview: {
      titleText: "Por que elegirnos",
      introText: "Las razones principales por las que los clientes se quedan con nosotros.",
      /*
       * V2-S2.1 section B: "Presenta pruebas, garantias o detalles que
       * reduzcan dudas." read as an instruction to whoever is BUILDING
       * the page, not visitor copy -- found during real-copy E2E review.
       * Replaced with a neutral, truthful line that claims no guarantee/
       * proof actually exists. "Menos friccion" item is untouched (not
       * identified as a live leak in this pass).
       */
      items: [["Mas confianza", "Encuentra la información que necesitas para decidir con confianza."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."]],
    },
    catalog: {
      titleText: "Beneficios de cada opcion",
      introText: "Compara a detalle lo que obtienes en cada alternativa antes de decidir.",
      items: [["Ventajas claras", "Cada opcion tiene beneficios especificos que puedes comparar antes de elegir."], ["Menos dudas", "Encuentra el detalle que necesitas para decidir con confianza."], ["Experiencia cuidada", "Cada punto de contacto esta pensado para que el proceso se sienta profesional."]],
    },
  },
  process: {
    overview: {
      titleText: "Como te ayudamos",
      introText: "Un resumen rapido del camino que recorres con nosotros.",
      items: [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]],
    },
    catalog: {
      titleText: "Nuestro proceso paso a paso",
      introText: "Asi es como avanzamos juntos desde el primer contacto hasta el resultado final.",
      items: [["1. Compartes el contexto", "Nos cuentas que necesitas sin formularios largos ni pasos innecesarios."], ["2. Analizamos las opciones", "Revisamos las alternativas disponibles y te mostramos la ruta mas clara."], ["3. Avanzamos juntos", "Confirmamos los detalles y damos el siguiente paso de forma concreta."]],
    },
  },
  products: {
    overview: {
      titleText: "Lo mas destacado",
      introText: "Una muestra rapida de lo que puedes encontrar en el catalogo completo.",
      items: [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."]],
    },
    catalog: {
      titleText: "Explora el catalogo completo",
      introText: "Compara opciones y elige la que mejor se adapta a lo que buscas.",
      items: [["Variedad disponible", "Compara varias opciones antes de decidir cual se adapta mejor a lo que buscas."], ["Detalle por opcion", "Cada producto incluye la informacion que necesitas para comparar con confianza."], ["Listo para elegir", "Encuentra la combinacion de caracteristicas y valor que mejor te convenga."]],
    },
  },
  pricing: {
    overview: {
      titleText: "Opciones para todos los presupuestos",
      introText: "Un vistazo rapido a los planes disponibles.",
      items: [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Premium", "Para clientes que quieren una experiencia mas completa."]],
    },
    catalog: {
      titleText: "Elige la opcion ideal",
      introText: "Presenta precios, paquetes u ofertas sin confundir al comprador.",
      items: [["Basico", "Cubre lo esencial para comenzar sin complicaciones."], ["Estandar", "El equilibrio entre alcance, soporte y valor que buscan la mayoria de clientes."], ["Avanzado", "Para quienes buscan la experiencia mas completa disponible."]],
    },
  },
  content: {
    overview: {
      titleText: "Lo esencial de un vistazo",
      introText: "Los puntos clave que todo visitante deberia conocer primero.",
      items: [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]],
    },
    catalog: {
      titleText: "Contenido a detalle",
      introText: "Toda la informacion relevante organizada para que puedas revisarla con calma.",
      items: [["Contexto completo", "Cada aspecto relevante queda explicado antes de que tengas que preguntar."], ["Puntos clave", "Cada seccion resalta lo que realmente importa antes de decidir."], ["Proximo paso", "Una guia clara de que hacer despues de revisar el contenido."]],
    },
  },
}

function cardGridCopy(role: SectionRole, archetype: SectionCompositionContext["archetype"], legacy: CardGridCopy): CardGridCopy {
  if (archetype === "overview" || archetype === "catalog") {
    return CARD_GRID_ARCHETYPE_COPY[role]?.[archetype] ?? legacy
  }

  return legacy
}

/**
 * Real, business-supplied services take over the "services" role's card
 * items when available -- overview gets a short, deterministic teaser
 * subset (never the full catalog), catalog gets all of them. Every other
 * card-grid role (features/products/pricing/process/content) keeps its
 * existing archetype-keyed scaffolding untouched.
 */
const OVERVIEW_SERVICE_TEASER_COUNT = 2

/**
 * V2-S1: generalized from the original services-only `realServiceItems`
 * -- consumes any real, business-supplied offering collection
 * (services OR products) with the same teaser/full-catalog archetype
 * behavior. `fallbackDescription` is role-aware so a dish name doesn't
 * get a service-flavored sentence ("...y como puede ayudarte") stitched
 * onto it; it is always GENERIC presentation copy, never an invented
 * fact (no price/ingredient/claim is ever synthesized here).
 */
function realOfferingItems(
  offerings: SectionCompositionContext["services"],
  archetype: SectionCompositionContext["archetype"],
  fallbackDescription: (name: string) => string,
): Array<[string, string]> {
  const usable = (offerings ?? [])
    .map((offering) => ({
      name: offering.name?.trim(),
      description: offering.description?.trim(),
    }))
    .filter(
      (offering): offering is { name: string; description: string | undefined } =>
        Boolean(offering.name),
    )

  if (!usable.length) return []

  const selected =
    archetype === "overview"
      ? usable.slice(0, OVERVIEW_SERVICE_TEASER_COUNT)
      : usable

  return selected.map((offering) => [
    offering.name,
    offering.description || fallbackDescription(offering.name),
  ])
}

/** Guardrail (V2-3 Section 12): fancy asymmetric/editorial treatments only make sense for a small, curated item count -- long real-service lists fall back to the safe grid automatically instead of producing an oversized featured card or a very long editorial scroll. */
const STRUCTURAL_TREATMENT_MAX_ITEMS = 6

function cardsLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  gridClassName: string,
): string {
  const cards = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body)
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    return wrapperNode(nodes, title, "rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10", children, "article")
  })
  return wrapperNode(nodes, "Grid " + role, gridClassName, cards)
}

/** FEATURES: alternating icon/text rows instead of a grid -- visual rhythm down the page. */
function alternatingRowsLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string } = DARK_ON_LIGHT_TEXT,
): string {
  const rows = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const iconWrap = wrapperNode(nodes, title + " icono wrap", "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700", icon ? [icon] : [])
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { color: textColors.body })
    const textStack = wrapperNode(nodes, title + " stack", "flex flex-col gap-2", [cardTitle, cardText])
    const reversed = index % 2 === 1
    return wrapperNode(
      nodes,
      title + " fila",
      `flex flex-col items-center gap-6 border-b border-slate-100 py-6 last:border-0 sm:items-center sm:text-left ${reversed ? "sm:flex-row-reverse sm:text-right" : "sm:flex-row"}`,
      [iconWrap, textStack],
    )
  })
  return wrapperNode(nodes, "Filas " + role, "flex flex-col", rows)
}

/** FEATURES: compact icon/list matrix -- denser, no card chrome, scan-friendly. */
function compactMatrixLayout(nodes: Record<string, ComposedNode>, role: SectionRole, items: Array<[string, string]>): string {
  const entries = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "lg", weight: "bold" })
    const cardText = textNode(nodes, title + " texto", body, { size: "sm" })
    const header = icon
      ? wrapperNode(nodes, title + " header", "flex items-center gap-2", [icon, cardTitle])
      : cardTitle
    return wrapperNode(nodes, title, "flex flex-col gap-1.5 rounded-xl bg-slate-50 p-4", [header, cardText])
  })
  return wrapperNode(nodes, "Matriz " + role, "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", entries)
}

/** SERVICES: numbered editorial list, no card borders -- reads like a menu/spec sheet rather than a grid. */
function editorialListLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string } = DARK_ON_LIGHT_TEXT,
): string {
  const rows = items.map(([title, body], index) => {
    const number = textNode(nodes, title + " numero", String(index + 1).padStart(2, "0"), { size: "sm", color: "#94a3b8" })
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { color: textColors.body })
    const textStack = wrapperNode(nodes, title + " stack", "flex flex-col gap-2", [cardTitle, cardText])
    return wrapperNode(nodes, title + " fila", "flex items-start gap-5 border-b border-slate-100 py-6 last:border-0", [number, textStack])
  })
  return wrapperNode(nodes, "Lista " + role, "flex flex-col", rows)
}

/** SERVICES: first item featured large, remaining items stacked smaller beside it. Falls back to a large asymmetric single passage when there's only one item (nothing to be "supporting"). */
function asymmetricFeaturedLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string } = DARK_ON_LIGHT_TEXT,
  align: SectionInstanceAlignment = "left",
): string {
  const [[featuredTitle, featuredBody], ...rest] = items

  const featuredIconName = cardIconName(role, 0)
  const featuredIcon = featuredIconName ? iconNode(nodes, featuredTitle + " ícono", featuredIconName) : null
  const featuredHeading = headingNode(nodes, featuredTitle, featuredTitle, 3, { size: "2xl", weight: "extrabold" })
  const featuredText = textNode(nodes, featuredTitle + " texto", featuredBody, { size: "lg" })
  const featuredChildren = featuredIcon ? [featuredIcon, featuredHeading, featuredText] : [featuredHeading, featuredText]

  if (rest.length === 0) {
    /*
     * V2-6.1: a single curated CompositionPlan instance (one real item)
     * still reads as a large, asymmetric editorial passage rather than a
     * centered generic card -- generous negative space plus a directional
     * accent rule that can mirror left/right across sibling instances of
     * the same role, instead of always looking identical regardless of
     * its position in the page.
     */
    const isRight = align === "right"
    const rule = wrapperNode(nodes, featuredTitle + " regla", `h-1 w-16 rounded-full bg-sky-300 ${isRight ? "self-end" : "self-start"}`, [])
    const passage = wrapperNode(
      nodes,
      featuredTitle + " pasaje",
      `flex max-w-2xl flex-col gap-5 ${isRight ? "items-end text-right self-end" : "items-start text-left self-start"}`,
      [rule, ...featuredChildren],
    )
    return wrapperNode(nodes, featuredTitle + " destacado", "flex w-full flex-col py-2", [passage])
  }

  const featured = wrapperNode(nodes, featuredTitle + " destacado", "flex flex-col justify-center gap-4 rounded-[2rem] bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-8", featuredChildren, "article")

  const supportingItems = rest.map(([title, body], index) => {
    const iconName = cardIconName(role, index + 1)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "lg", weight: "bold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { size: "sm", color: textColors.body })
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    return wrapperNode(nodes, title, "flex flex-col gap-1.5 rounded-xl border border-slate-100 p-4", children)
  })
  const supporting = wrapperNode(nodes, "Servicios secundarios", "flex flex-col gap-3", supportingItems)

  return wrapperNode(nodes, "Asimetrico " + role, "grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-stretch", [featured, supporting])
}

/**
 * V2-5B C4: PROCESS -- bold ordered numerals, visually distinct from
 * every card-grid treatment above (large ghost numeral beside the
 * step, not a small inline prefix like editorialListLayout's). Never
 * invents steps: `items` are whatever composeCardGridSection already
 * resolved (real context.processSteps when supplied, the existing
 * deterministic 3-step placeholder copy otherwise -- exactly the same
 * "real facts override generic copy, never fabricated" rule services/
 * products already follow).
 */
function numberedProcessLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string },
): string {
  const accentNumberColor = textColors.heading === "#ffffff" ? "rgba(255,255,255,0.35)" : "#cbd5e1"
  const steps = items.map(([title, body], index) => {
    const number = textNode(nodes, title + " numero", String(index + 1).padStart(2, "0"), { size: "4xl", weight: "extrabold", color: accentNumberColor })
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { color: textColors.body })
    const textStack = wrapperNode(nodes, title + " stack", "flex flex-col gap-2", [cardTitle, cardText])
    return wrapperNode(nodes, title + " paso", "flex flex-col gap-3", [number, textStack])
  })
  return wrapperNode(nodes, "Pasos " + role, "grid gap-8 sm:grid-cols-2 lg:grid-cols-3", steps)
}

/**
 * V2-5B C3: PAIRED LAYOUT -- two emphasized panels side by side,
 * instead of forcing everything through a 3-column grid. Deliberately
 * role-agnostic (works for any role's exactly-two-items case) and
 * content-driven, never a "case studies" component: whatever [title,
 * body] pairs the caller already resolved (real services/products/
 * process content, or the existing generic placeholder copy) render
 * here unchanged.
 */
function pairedLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string },
): string {
  const isDark = textColors.heading === "#ffffff"
  const panelClassName = isDark
    ? "flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8"
    : "flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"

  const panels = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: "2xl", weight: "extrabold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { size: "lg", color: textColors.body })
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    return wrapperNode(nodes, title, panelClassName, children, "article")
  })
  return wrapperNode(nodes, "Pareja " + role, "grid gap-6 md:grid-cols-2", panels)
}

function premiumCompositionTreatment(context: SectionCompositionContext): PremiumCompositionTreatment | undefined {
  return context.richComposition && context.aiPremiumCompositionTreatment && (PREMIUM_COMPOSITION_TREATMENTS as readonly string[]).includes(context.aiPremiumCompositionTreatment)
    ? context.aiPremiumCompositionTreatment
    : undefined
}

/**
 * V2-6.1: `allowSingleItem` loosens the item-count floor to 1 ONLY for a
 * deliberately curated single-item CompositionPlan instance (see
 * SectionCompositionContext.singleItemInstance) -- never for a naturally
 * short real-business collection, which still falls through to the
 * existing safe plain grid exactly as before. asymmetricFeaturedLayout/
 * alternatingRowsLayout/mediaLedLayout already render a single item
 * gracefully (see their own single-item branches); this only changes
 * whether the fallback OFFERS them one.
 */
function premiumFallbackTreatment(
  treatment: PremiumCompositionTreatment,
  itemCount: number,
  hasUsableMediaAsset: boolean,
  allowSingleItem: boolean = false,
): PremiumCompositionTreatment | undefined {
  const minItems = allowSingleItem ? 1 : 2
  const minFeatured = allowSingleItem ? 1 : 3
  if (treatment === "standard-grid") return "standard-grid"
  if (treatment === "featured-asymmetric" && itemCount >= minFeatured && itemCount <= STRUCTURAL_TREATMENT_MAX_ITEMS) return treatment
  if (treatment === "editorial-alternating" && itemCount >= minItems && itemCount <= STRUCTURAL_TREATMENT_MAX_ITEMS) return treatment
  if (treatment === "bento" && itemCount >= minFeatured && itemCount <= STRUCTURAL_TREATMENT_MAX_ITEMS) return treatment
  if (treatment === "media-led" && hasUsableMediaAsset && itemCount >= minItems && itemCount <= STRUCTURAL_TREATMENT_MAX_ITEMS) return treatment
  if (itemCount >= minItems && itemCount <= STRUCTURAL_TREATMENT_MAX_ITEMS) return "editorial-alternating"
  return undefined
}

function pricingTreatmentFor(context: SectionCompositionContext): "standard" | "tier-highlight" | undefined {
  return context.richComposition && context.aiPreferredPricingTreatment && (PRICING_TREATMENTS as readonly string[]).includes(context.aiPreferredPricingTreatment)
    ? context.aiPreferredPricingTreatment
    : undefined
}

/**
 * PRICING tier-highlight -- V2-5G. Presentation-only geometry: the
 * highlighted tier (the middle item for 3, the last for 2) gets a
 * background tint, a heavier border, scale/spacing emphasis, and a
 * primary-variant CTA; every other tier gets a plain surface and a
 * secondary-variant CTA. No badge, no "mas popular"/"recomendado por
 * clientes"/performance label, no price, no numeric claim -- the tier
 * name/description are whatever composeCardGridSection already resolved
 * (real offering or generic fallback copy), untouched here. The CTA label
 * reuses the same safe, non-transactional wording already used elsewhere
 * in this file ("Solicitar informacion") and points at the canonical
 * "#contacto" anchor -- never a fake checkout/cart action.
 */
function pricingTierLayout(
  nodes: Record<string, ComposedNode>,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string },
): string {
  const highlightIndex = items.length >= 3 ? 1 : items.length - 1
  const cards = items.map(([title, body], index) => {
    const isHighlighted = index === highlightIndex
    const cardTitle = headingNode(nodes, title, title, 3, { size: "xl", weight: "bold", color: isHighlighted ? "#0369a1" : textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { color: textColors.body })
    const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: title + " boton", props: { label: "Solicitar información", href: "#contacto", variant: isHighlighted ? "primary" : "secondary", size: "md" } }))
    const cardClassName = isHighlighted
      ? "flex flex-col gap-3 rounded-[1.5rem] border-2 border-sky-300 bg-sky-50 p-6 shadow-xl shadow-sky-900/10 md:-translate-y-2 md:scale-[1.03]"
      : "flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
    return wrapperNode(nodes, title, cardClassName, [cardTitle, cardText, cta], "article")
  })
  return wrapperNode(nodes, "Grid pricing", "grid gap-5 md:grid-cols-3 md:items-center", cards)
}

function bentoLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string },
): string {
  const cards = items.map(([title, body], index) => {
    const iconName = cardIconName(role, index)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const cardTitle = headingNode(nodes, title, title, 3, { size: index === 0 ? "2xl" : "lg", weight: "bold", color: textColors.heading })
    const cardText = textNode(nodes, title + " texto", body, { size: index === 0 ? "lg" : "sm", color: textColors.body })
    const children = icon ? [icon, cardTitle, cardText] : [cardTitle, cardText]
    const spanClass = index === 0
      ? "md:col-span-4 md:row-span-2"
      : index === 1
        ? "md:col-span-2"
        : index === 2
          ? "md:col-span-2"
          : "md:col-span-3"
    return wrapperNode(nodes, `${title} bento`, `flex min-h-44 flex-col justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${spanClass}`, children, "article")
  })
  return wrapperNode(nodes, "Bento " + role, "grid auto-rows-fr gap-4 md:grid-cols-6", cards)
}

function mediaLedLayout(
  nodes: Record<string, ComposedNode>,
  role: SectionRole,
  items: Array<[string, string]>,
  textColors: { heading: string; body: string },
  mediaAsset: { src: string; alt?: string },
): string {
  const [[leadTitle, leadBody], ...rest] = items
  const image = add(nodes, createComposedNode({ type: "image", displayName: `${leadTitle} imagen`, props: { src: mediaAsset.src, alt: mediaAsset.alt ?? leadTitle, objectFit: "cover", positionMode: "free" } }))
  const media = wrapperNode(nodes, `${leadTitle} media`, "relative min-h-72 overflow-hidden rounded-[2rem] bg-slate-100", [image])
  const leadHeading = headingNode(nodes, leadTitle, leadTitle, 3, { size: "2xl", weight: "extrabold", color: textColors.heading })
  const leadText = textNode(nodes, leadTitle + " texto", leadBody, { size: "lg", color: textColors.body })
  const leadContent = wrapperNode(nodes, `${leadTitle} contenido`, "flex flex-col justify-center gap-4", [leadHeading, leadText])
  const lead = wrapperNode(nodes, `${leadTitle} layout media`, "grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch", [media, leadContent], "article")

  const supporting = rest.map(([title, body], index) => {
    const iconName = cardIconName(role, index + 1)
    const icon = iconName ? iconNode(nodes, title + " ícono", iconName) : null
    const titleNode = headingNode(nodes, title, title, 3, { size: "lg", weight: "bold", color: textColors.heading })
    const bodyNode = textNode(nodes, title + " texto", body, { size: "sm", color: textColors.body })
    const textStack = wrapperNode(nodes, `${title} stack`, "flex flex-col gap-1.5", [titleNode, bodyNode])
    return wrapperNode(nodes, `${title} item`, "grid gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4 sm:grid-cols-[auto_1fr] sm:items-start", icon ? [icon, textStack] : [textStack], "article")
  })
  const supportWrap = wrapperNode(nodes, "Media-led soporte " + role, "grid gap-3 md:grid-cols-2", supporting)
  return wrapperNode(nodes, "Media-led " + role, "flex flex-col gap-5", [lead, supportWrap])
}

/*
 * =============================================================
 * V2-6.2: four high-contrast VISUAL COMPOSITION PRIMITIVES.
 *
 * Each function below is generic (structured props only, no
 * business/industry copy or logic baked in) and reusable across
 * whichever roles list it in ROLE_VISUAL_PRIMITIVE_VOCABULARY
 * (architect/composition-plan.ts). None emits arbitrary HTML/CSS: every
 * className is a fixed literal this file already owns, exactly like
 * every other layout function above.
 * =============================================================
 */

/**
 * OVERSIZED TYPOGRAPHY: a bare typographic interruption -- no card, no
 * grid, no border/shadow/rounded classes anywhere. Deliberately the
 * OPPOSITE shape of every card-grid layout above: one constrained-width
 * text column with a genuinely bigger heading token ("7xl", added in
 * Heading.tsx specifically because "5xl" was already the standard hero's
 * own ceiling -- see V2-6.2's audit). Works with or without a body/
 * eyebrow; never fabricates either.
 */
function oversizedTypographyPassage(
  nodes: Record<string, ComposedNode>,
  params: {
    keyBase: string
    eyebrow?: string
    title: string
    body?: string
    align?: "left" | "center"
    headingSize?: "5xl" | "6xl" | "7xl"
    textColors: { heading: string; body: string }
  },
): string {
  const { keyBase, eyebrow, title, body, align = "left", headingSize = "7xl", textColors } = params
  const eyebrowNode = eyebrow
    ? textNode(nodes, `${keyBase} eyebrow`, eyebrow, { size: "sm", align })
    : null
  const titleNode = headingNode(nodes, `${keyBase} titulo`, title, 2, { size: headingSize, weight: "extrabold", align, color: textColors.heading })
  const bodyNode = body
    ? textNode(nodes, `${keyBase} texto`, body, { size: "lg", align, color: textColors.body, maxWidth: align === "center" ? "lg" : "none" })
    : null
  const children = [eyebrowNode, titleNode, bodyNode].filter((id): id is string => Boolean(id))
  const alignmentClassName = align === "center" ? "mx-auto items-center text-center" : "items-start text-left"
  return wrapperNode(nodes, `${keyBase} bloque tipografico`, `flex max-w-4xl flex-col gap-6 ${alignmentClassName}`, children)
}

/**
 * EDITORIAL SPLIT: a genuine two-column asymmetric passage -- roughly
 * 45/55, real DOM order (not a CSS-only trick), mirrorable by literally
 * swapping which side comes first so `align: "right"` produces a
 * MATERIALLY different child order/geometry, not just text-align. When
 * no real media asset exists for this item, the "other side" becomes an
 * intentional oversized-numeral graphic field (composed from the exact
 * same heading/wrapper primitives every other layout uses) instead of a
 * broken image placeholder.
 */
function editorialSplitPassage(
  nodes: Record<string, ComposedNode>,
  params: {
    index: number
    title: string
    body: string
    align: SectionInstanceAlignment
    textColors: { heading: string; body: string }
    mediaAsset?: { src: string; alt?: string }
  },
): string {
  const { index, title, body, align, textColors, mediaAsset } = params
  const ordinal = String(index + 1).padStart(2, "0")

  const eyebrow = textNode(nodes, `${title} indice`, ordinal, { size: "sm", color: textColors.body })
  const heading = headingNode(nodes, title, title, 3, { size: "5xl", weight: "extrabold", color: textColors.heading })
  const text = textNode(nodes, `${title} texto`, body, { size: "lg", color: textColors.body })
  const textBlock = wrapperNode(nodes, `${title} bloque texto`, "flex flex-col justify-center gap-5 lg:min-h-[24rem]", [eyebrow, heading, text])

  let mediaBlock: string
  if (mediaAsset?.src.trim()) {
    const image = add(nodes, createComposedNode({ type: "image", displayName: `${title} imagen`, props: { src: mediaAsset.src, alt: mediaAsset.alt ?? title, objectFit: "cover", positionMode: "free" } }))
    mediaBlock = wrapperNode(nodes, `${title} media`, "relative min-h-[22rem] overflow-hidden rounded-[1.5rem] lg:min-h-[28rem]", [image])
  } else {
    const graphicNumeral = headingNode(nodes, `${title} numeral grafico`, ordinal, 2, { size: "7xl", weight: "extrabold", align: "center", color: textColors.body })
    mediaBlock = wrapperNode(
      nodes,
      `${title} campo grafico`,
      "flex min-h-[22rem] items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-50 to-white border border-sky-100 lg:min-h-[28rem]",
      [graphicNumeral],
    )
  }

  const orderedChildren = align === "right" ? [mediaBlock, textBlock] : [textBlock, mediaBlock]
  return wrapperNode(nodes, `${title} split`, "grid gap-10 lg:grid-cols-2 lg:items-stretch", orderedChildren)
}

/**
 * FULL-BLEED MEDIA: edge-to-edge presentation -- the section itself must
 * be built with maxWidth "full" + paddingX "none" (see composeGallery's
 * call site) for this to actually reach the viewport edge; this function
 * only builds the media layer + adjacent caption, reusing the exact
 * "absolute inset-0 h-full w-full" mechanism composeHero's immersive
 * variant already uses for full-bleed photography. Never invents an
 * asset: callers only reach this with a real, usable one.
 */
function fullBleedMediaBlock(
  nodes: Record<string, ComposedNode>,
  params: { title: string; caption?: string; asset: { src: string; alt?: string }; textColors: { heading: string; body: string } },
): string {
  const { title, caption, asset, textColors } = params
  const image = add(nodes, createComposedNode({ type: "image", displayName: `${title} imagen full-bleed`, props: { src: asset.src, alt: asset.alt ?? title, objectFit: "cover", positionMode: "free" } }))
  const mediaLayer = wrapperNode(nodes, `${title} capa media`, "absolute inset-0 h-full w-full bg-slate-900", [image])
  const captionNode = caption
    ? wrapperNode(
        nodes,
        `${title} leyenda`,
        "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-6 py-6",
        [textNode(nodes, `${title} leyenda texto`, caption, { size: "lg", color: textColors.heading === "#ffffff" ? "#ffffff" : "#f8fafc" })],
      )
    : null
  const frame = wrapperNode(nodes, `${title} marco full-bleed`, "relative min-h-[60vh] w-full overflow-hidden md:min-h-[70vh]", captionNode ? [mediaLayer, captionNode] : [mediaLayer])
  return frame
}

function composeCardGridSection(
  role: SectionRole,
  titleText: string,
  introText: string,
  items: Array<[string, string]>,
  context: SectionCompositionContext = {},
): ComposedSection {
  const baseCopy = cardGridCopy(role, context.archetype, { titleText, introText, items })
  // COMMERCE-3C: a closed narrative intent reframes a PRESENTATION products grid with the same Orvenix-owned copy table.
  const narrativeCopy = role === "products" && context.instanceNarrativeIntent && context.products?.length
    ? commerceProductsCopy(context.instanceNarrativeIntent, context.products, { title: baseCopy.titleText, intro: baseCopy.introText })
    : undefined
  const copy = narrativeCopy ? { ...baseCopy, titleText: narrativeCopy.title, introText: narrativeCopy.intro ?? "" } : baseCopy
  const realItems =
    role === "services"
      ? realOfferingItems(context.services, context.archetype, (name) => `Conoce mas sobre ${name.toLowerCase()} y como puede ayudarte.`)
      : role === "products"
        ? realOfferingItems(context.products, context.archetype, (name) => `Descubre mas sobre ${name.toLowerCase()}.`)
        : role === "process"
          /*
           * V2-5B C4: same "real facts override generic copy, never
           * fabricated" rule services/products already follow --
           * processSteps is nothing today calls with real data yet (no
           * Creative Director/retrieval wiring in this phase), so this
           * stays a no-op until a future phase supplies it.
           */
          ? realOfferingItems(context.processSteps, context.archetype, (name) => `Explica que sucede en el paso "${name.toLowerCase()}".`)
          : []
  /*
   * V2-S2 sections 5/6: features/process get a small, fact-gated copy
   * override (never a real-offering listing -- that would just duplicate
   * the services/products role's own grid). Every other role's `copy`
   * passes through unchanged.
   */
  const personalizedItems = role === "features" ? resolveFeatureItems(context, copy.items) : copy.items
  const personalizedIntro = role === "process" ? resolveProcessIntro(context, copy.introText) : copy.introText
  const finalItems = realItems.length ? realItems : personalizedItems
  const nodes: Record<string, ComposedNode> = {}

  /*
   * V2-5B C6: background rhythm. "hero"/"trust"/"faq"/"testimonials"/
   * "footer"/"navigation" keep their own established fixed backgrounds
   * (untouched) -- this only varies the shared card-grid roles
   * (services/features/products/pricing/process/content), which
   * previously ALWAYS hardcoded white regardless of position. Gated
   * behind context.richComposition -- unset resolves to the exact
   * pre-V2-5B "base" (#ffffff) every existing caller already gets.
   */
  const tone = context.richComposition ? resolveSectionTone(context, role) : "base"
  const background = resolveToneBackground(tone, context)
  const textColors = readableTextColorsFor(background)

  /*
   * V2-6.2: a role-appropriate visualPrimitive short-circuits the entire
   * card-grid/treatment machinery below -- these two primitives are
   * DELIBERATELY not another grid/card variant, they are the opposite
   * shape. Only reachable when composition-plan.ts's
   * ROLE_VISUAL_PRIMITIVE_VOCABULARY already allowed this exact
   * (role, primitive) pair upstream, so no role/primitive mismatch can
   * reach here; absent/"standard"/unrecognized falls through unchanged
   * to every pre-V2-6.2 caller's exact existing behavior below.
   */
  if (context.instanceVisualPrimitive === "editorial-split" && finalItems.length >= 1) {
    const [title, body] = finalItems[0]
    // COMMERCE-3C: media intent "none"/"minimal" (mediaStrategy "none") keeps this passage copy-led even when an asset exists.
    const mediaAsset = context.instanceMediaStrategy !== "none" && context.resolvedMediaAsset?.src.trim() ? { src: context.resolvedMediaAsset.src.trim(), alt: context.resolvedMediaAsset.alt } : undefined
    const passage = editorialSplitPassage(nodes, {
      index: context.sectionIndex ?? 0,
      title,
      body,
      align: context.instanceAlignment ?? "left",
      textColors,
      mediaAsset,
    })
    const paddingY = context.instanceScale === "condensed" ? "lg" : "xl"
    const root = add(nodes, createComposedNode({ type: "section", displayName: `${title} (editorial-split)`, props: { maxWidth: "xl", paddingY, paddingX: "lg", background }, children: [passage] }))
    return { role, rootId: root, nodes, purpose: body }
  }

  if (context.instanceVisualPrimitive === "oversized-typography" && finalItems.length >= 1) {
    const [title, body] = finalItems[0]
    const passage = oversizedTypographyPassage(nodes, {
      keyBase: title,
      title,
      body,
      align: "left",
      headingSize: context.instanceScale === "condensed" ? "6xl" : "7xl",
      textColors,
    })
    const paddingY = context.instanceScale === "condensed" ? "lg" : "xl"
    const root = add(nodes, createComposedNode({ type: "section", displayName: `${title} (oversized-typography)`, props: { maxWidth: "xl", paddingY, paddingX: "lg", background }, children: [passage] }))
    return { role, rootId: root, nodes, purpose: body }
  }

  /*
   * V2-6.1: a curated single-item CompositionPlan instance skips the
   * generic role-level "Servicios"/"Productos" wrapper title -- the
   * passage below already carries the one real item's own name as its
   * heading. Rendering both would just reproduce the "looks the same,
   * only the minimum changes" generic feel the Composition Plan layer
   * exists to fix. Every existing (non-instance) caller still gets both
   * nodes exactly as before.
   */
  const suppressWrapperHeading = Boolean(context.singleItemInstance)
  const heading = suppressWrapperHeading ? null : headingNode(nodes, "Titulo " + role, copy.titleText, 2, { align: "center", color: textColors.heading })
  const intro = suppressWrapperHeading ? null : textNode(nodes, "Intro " + role, personalizedIntro, { align: "center", size: "lg", color: textColors.body })

  /*
   * "services" is the flagship role shared between overview and catalog
   * pages: give catalog a visibly different default grid (fewer, wider
   * columns) instead of layering layout variance onto every role.
   */
  const defaultGridClassName = role === "services" && context.archetype === "catalog"
    ? "grid gap-6 md:grid-cols-2"
    : "grid gap-5 md:grid-cols-3"

  const canUseStructuralTreatment = finalItems.length >= 2 && finalItems.length <= STRUCTURAL_TREATMENT_MAX_ITEMS

  let grid: string
  let layoutVariant = "cards"

  const requestedPremiumTreatment = premiumCompositionTreatment(context)
  const mediaAsset = context.resolvedMediaAsset?.src.trim() ? { src: context.resolvedMediaAsset.src.trim(), alt: context.resolvedMediaAsset.alt } : undefined
  const effectivePremiumTreatment = requestedPremiumTreatment
    ? premiumFallbackTreatment(requestedPremiumTreatment, finalItems.length, Boolean(mediaAsset), Boolean(context.singleItemInstance))
    : undefined
  const requestedPricingTreatment = role === "pricing" ? pricingTreatmentFor(context) : undefined

  if (requestedPricingTreatment === "tier-highlight" && finalItems.length >= 2 && finalItems.length <= STRUCTURAL_TREATMENT_MAX_ITEMS) {
    layoutVariant = "tier-highlight"
    grid = pricingTierLayout(nodes, finalItems, textColors)
  } else if (effectivePremiumTreatment && role !== "pricing" && role !== "process") {
    layoutVariant = effectivePremiumTreatment
    if (effectivePremiumTreatment === "featured-asymmetric") grid = asymmetricFeaturedLayout(nodes, role, finalItems, textColors, context.instanceAlignment)
    else if (effectivePremiumTreatment === "editorial-alternating") grid = alternatingRowsLayout(nodes, role, finalItems, textColors)
    else if (effectivePremiumTreatment === "bento") grid = bentoLayout(nodes, role, finalItems, textColors)
    else if (effectivePremiumTreatment === "media-led" && mediaAsset) grid = mediaLedLayout(nodes, role, finalItems, textColors, mediaAsset)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else if (context.richComposition && finalItems.length === 2) {
    /*
     * V2-5B C3 refinement: exactly two real items makes paired-layout
     * ELIGIBLE, not mandatory -- resolved through the same deterministic
     * weighted-selection mechanism every other role uses (see
     * TWO_ITEM_LAYOUT_VARIANTS' doc comment for why this is its own
     * small vocabulary rather than folded into ServicesVariant/
     * FeaturesVariant/ProcessVariant). The "cards" alternative reuses
     * the existing generic grid, which already handles a 2-item list
     * correctly -- no third/fake item, no duplication, still exactly
     * the same two real items either way. Gated the same way as tone:
     * unset context.richComposition means every existing caller keeps
     * its exact pre-V2-5B 2-item behavior (whichever role-specific
     * branch below it already fell into).
     */
    /*
     * V2-5C: aiPreferredTwoItemLayoutTreatment overrides the weighted
     * pick ONLY when it's one of the actually-registered
     * TWO_ITEM_LAYOUT_VARIANTS -- same defensive re-check pattern as
     * aiPreferredHeroVariant.
     */
    const twoItemTreatment =
      context.aiPreferredTwoItemLayoutTreatment && (TWO_ITEM_LAYOUT_VARIANTS as readonly string[]).includes(context.aiPreferredTwoItemLayoutTreatment)
        ? context.aiPreferredTwoItemLayoutTreatment
        : selectVariant(context, "two-item-layout", TWO_ITEM_LAYOUT_VARIANTS, TWO_ITEM_LAYOUT_WEIGHTS)
    if (twoItemTreatment === "paired") {
      layoutVariant = "paired-layout"
      grid = pairedLayout(nodes, role, finalItems, textColors)
    } else {
      layoutVariant = "cards"
      grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
    }
  } else if (role === "features" && canUseStructuralTreatment) {
    layoutVariant = selectVariant(context, "features", FEATURES_VARIANTS, FEATURES_WEIGHTS)
    if (layoutVariant === "alternating-rows") grid = alternatingRowsLayout(nodes, role, finalItems, textColors)
    else if (layoutVariant === "compact-matrix") grid = compactMatrixLayout(nodes, role, finalItems)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else if (role === "services" && canUseStructuralTreatment) {
    layoutVariant = selectVariant(context, "services", SERVICES_VARIANTS, SERVICES_WEIGHTS)
    if (layoutVariant === "editorial-list") grid = editorialListLayout(nodes, role, finalItems, textColors)
    else if (layoutVariant === "asymmetric-featured") grid = asymmetricFeaturedLayout(nodes, role, finalItems, textColors)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else if (role === "process" && canUseStructuralTreatment && context.richComposition) {
    /*
     * V2-5C: aiPreferredProcessTreatment overrides the weighted pick
     * ONLY when it's one of the actually-registered PROCESS_VARIANTS --
     * same defensive re-check pattern as aiPreferredHeroVariant.
     */
    layoutVariant =
      context.aiPreferredProcessTreatment && (PROCESS_VARIANTS as readonly string[]).includes(context.aiPreferredProcessTreatment)
        ? context.aiPreferredProcessTreatment
        : selectVariant(context, "process", PROCESS_VARIANTS, PROCESS_WEIGHTS)
    if (layoutVariant === "numbered") grid = numberedProcessLayout(nodes, role, finalItems, textColors)
    else grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  } else {
    grid = cardsLayout(nodes, role, finalItems, defaultGridClassName)
  }

  /*
   * V2-4: density is a SITE-level, bounded, already-validated hint --
   * reuses the exact "lg"/"xl" paddingY tokens already rendered
   * elsewhere in this file, never a new token. "spacious" keeps the
   * existing "xl" default (already the largest token this file uses);
   * only "compact" changes the render, and only for card-grid roles.
   */
  const paddingY = context.instanceScale === "condensed" ? "lg" : context.aiDensity === "compact" ? "lg" : "xl"
  /*
   * V2-6.1: instanceScale only ever touches this outer section's own
   * spacing/width -- never the treatment/heading sizes inside `grid`,
   * which stay exactly what the chosen layout function already renders.
   * Absent -> byte-identical "xl" pre-V2-6.1 width.
   */
  const maxWidth = context.instanceScale === "condensed" ? "lg" : context.instanceScale === "large" ? "full" : "xl"
  const sectionChildren = [heading, intro, grid].filter((id): id is string => Boolean(id))

  const root = add(nodes, createComposedNode({ type: "section", displayName: `${copy.titleText} (${layoutVariant})`, props: { maxWidth, paddingY, paddingX: "lg", background }, children: sectionChildren }))
  return { role, rootId: root, nodes, purpose: copy.introText }
}

function composeServices(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("services", "Servicios pensados para vender mejor", "Organiza tu oferta para que el visitante entienda rapido que haces y por que debe contactarte.", [["Servicio principal", "Explica el resultado mas valioso que obtiene tu cliente."], ["Acompanamiento experto", "Muestra como guias al cliente antes, durante y despues del servicio."], ["Entrega clara", "Convierte tu proceso en una razon para confiar y avanzar."]], context) }
/** V2-S2.1 section B: same "Presenta pruebas..." live leak, same fix, in the legacy (non-overview/catalog) default -- see the CARD_GRID_ARCHETYPE_COPY.features.overview comment above. */
function composeFeatures(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("features", "Beneficios que se entienden al instante", "Transforma caracteristicas en razones claras para elegir tu negocio.", [["Mas confianza", "Encuentra la información que necesitas para decidir con confianza."], ["Menos friccion", "Haz facil pedir informacion, reservar, comprar o cotizar."], ["Mejor experiencia", "Cuida cada punto de contacto para que el sitio se sienta profesional."]], context) }
function composeProcess(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("process", "Un proceso simple para empezar", "Ayuda al cliente a saber que pasara despues de dar clic.", [["1. Cuentanos tu objetivo", "Recibe la informacion clave sin formularios largos."], ["2. Revisamos la mejor ruta", "Muestra una propuesta clara y adaptada al caso."], ["3. Activamos el siguiente paso", "Cierra con una accion concreta y facil de completar."]], context) }
/**
 * COMMERCE-1: grounded display suffix for PRESENTATION product cards --
 * price/availability come only from caller-supplied facts (never
 * synthesized), and a product without variants is returned untouched, so
 * legacy `{ name, description }` products render byte-identically.
 */
function withPresentationCommerceFacts(product: CommerceProductFactV1): CommerceProductFactV1 {
  const priceLine = presentationPriceLineV1(product)
  if (!priceLine) return product
  const availabilities = new Set((product.variants ?? []).map((variant) => variant.availability))
  const availabilityNote = availabilities.size === 1 && availabilities.has("out_of_stock")
    ? "Agotado"
    : availabilities.size === 1 && availabilities.has("preorder")
      ? "Preventa"
      : undefined
  return { ...product, description: [product.description, priceLine, availabilityNote].filter(Boolean).join(" — ") }
}

const STORE_PRODUCTS_SECTION_BACKGROUND = "#0f172a"

/**
 * COMMERCE-1: the ONLY path that emits functional commerce nodes. Reached
 * exclusively when EVERY product in this (possibly instance-sliced)
 * context is a BOUND executable product (real Product.id + a real
 * ProductVariant.id, see commerce/product-facts.ts). Emits the EXISTING
 * registered `store-product-card` block -- its own add-to-cart feeds the
 * existing cart store / CartDrawer / checkout route. Dark section
 * background because the existing card is styled for dark surfaces.
 */
function storeCardProps(product: CommerceProductFactV1, context: SectionCompositionContext): Record<string, unknown> | null {
  const accent = context.accentColor ? { accentColor: context.accentColor } : {}
  const variant = executableVariantForProductV1(product)
  if (variant && product.storeBinding) {
    return {
      productId: product.storeBinding.productId,
      variantId: variant.variantId,
      productName: product.name,
      variantName: variant.label,
      priceMxn: variant.priceMxn,
      ...(variant.comparePriceMxn !== undefined ? { comparePriceMxn: variant.comparePriceMxn } : {}),
      stock: variant.stock ?? 0,
      ...accent,
    }
  }

  /*
   * COMMERCE-2A: PENDING card -- a provisioning reference only, NO
   * productId/variantId, so the existing card renders it non-executable
   * (no add-to-cart) until the confirm step binds it to real rows.
   */
  const pending = product.pendingProvisioning
  const pendingVariant = pending ? product.variants?.[pending.variantIndex] : undefined
  if (pending && pendingVariant) {
    return {
      provisioningRef: formatProvisioningRefV1(pending.sourceIndex, pending.variantIndex),
      productName: product.name,
      variantName: pendingVariant.label,
      priceMxn: pendingVariant.priceMxn,
      ...(pendingVariant.comparePriceMxn !== undefined ? { comparePriceMxn: pendingVariant.comparePriceMxn } : {}),
      stock: pendingVariant.initialStock ?? 0,
      ...accent,
    }
  }
  return null
}

/**
 * COMMERCE-3C: Orvenix-owned STRUCTURAL copy for a commerce products
 * section, selected by a closed narrative intent. Only grounded facts are
 * interpolated (product name/description, category label, item count);
 * every other string is generic framing that makes no claim about quality,
 * shipping, returns, popularity, discounts or availability. Absent intent
 * -> the exact pre-COMMERCE-3C copy.
 */
function commerceProductsCopy(
  narrative: SectionCompositionContext["instanceNarrativeIntent"],
  products: readonly CommerceProductFactV1[],
  fallback: { title: string; intro?: string },
): { title: string; intro?: string } {
  if (!narrative) return fallback
  const single = products.length === 1 ? products[0] : undefined
  const categories = new Set(products.map((product) => product.category?.trim()).filter(Boolean))
  const category = categories.size === 1 ? [...categories][0] : undefined
  const description = single?.description?.trim() || undefined
  const count = products.length
  switch (narrative) {
    case "product-led":
      return single ? { title: single.name, intro: description } : { title: "Productos destacados", intro: "Una selección de productos de la tienda." }
    case "category-discovery":
      return category ? { title: category, intro: `Productos de ${category}.` } : { title: "Explora por categoría", intro: "Recorre los productos por categoría." }
    case "editorial-story":
      return single ? { title: single.name, intro: description } : { title: category ?? "Selección de la tienda" }
    case "benefit-led":
      return { title: "Lo que encuentras en la tienda", intro: "Cada producto muestra su precio antes de comprar." }
    case "trust-led":
      return { title: "Compra con información clara", intro: "Consulta el precio y la disponibilidad de cada producto antes de agregarlo al carrito." }
    case "conversion-led":
      return { title: single ? single.name : "Elige tu producto", intro: "Agrega productos al carrito para iniciar tu compra." }
    case "minimal-introduction":
      return { title: single ? single.name : category ?? "Productos" }
    case "catalog-orientation":
      return { title: "Catálogo", intro: `${count} ${count === 1 ? "producto" : "productos"} en el catálogo.` }
  }
}

const STORE_SECTION_BACKGROUND_BY_TONE: Record<string, string> = {
  "contrast-led": "#020617",
  "soft-rhythm": "#111827",
}

function storeCardsGridClass(context: SectionCompositionContext, inSplit: boolean): string {
  const mediaLed = context.instanceMediaStrategy === "led"
  const compact = context.instanceScale === "condensed" || context.instanceMediaStrategy === "none"
  if (inSplit) return mediaLed || context.instanceScale === "large" ? "grid gap-6" : "grid gap-4 sm:grid-cols-2"
  if (mediaLed) return "grid gap-8 sm:grid-cols-2"
  if (compact) return "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
  if (context.instanceScale === "large") return "grid gap-8 md:grid-cols-2"
  return "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
}

function composeStoreProductsSection(context: SectionCompositionContext, products: CommerceProductFactV1[]): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  // An explicit curated selection (COMMERCE-3C) is authoritative; the teaser cut only applies to un-curated overview grids.
  const selected = context.archetype === "overview" && !context.instanceSelectionApplied ? products.slice(0, OVERVIEW_SERVICE_TEASER_COUNT) : products
  const background = (context.aiSectionToneStrategy && STORE_SECTION_BACKGROUND_BY_TONE[context.aiSectionToneStrategy]) || STORE_PRODUCTS_SECTION_BACKGROUND
  const textColors = readableTextColorsFor(background)
  const layoutKind = context.instanceVisualLayout?.kind
  const isSplit = layoutKind === "editorial-split" || layoutKind === "mirror-split"
  const mirrored = visualLayoutMirrorsContent(context.instanceVisualLayout)

  const cards: string[] = []
  for (const [index, product] of selected.entries()) {
    const props = storeCardProps(product, context)
    if (!props) continue
    // COMMERCE-5B: only the compiler-aligned, Orvenix-resolved detail page for THIS product.
    const detailHref = context.commerceProductDetailHrefs?.[index]
    cards.push(add(nodes, createComposedNode({
      type: "store-product-card",
      displayName: `Producto ${index + 1}: ${product.name}`,
      props: detailHref && SECTION_INSTANCE_PAGE_HREF_PATTERN.test(detailHref) ? { ...props, detailHref } : props,
    })))
  }

  const fallbackTitle = context.archetype === "overview" ? "Productos destacados" : "Catalogo"
  const copy = commerceProductsCopy(context.instanceNarrativeIntent, selected, { title: fallbackTitle, intro: "Agrega productos al carrito para iniciar tu compra." })
  const showHeader = !context.singleItemInstance || Boolean(context.instanceNarrativeIntent)
  const align = isSplit ? "left" : "center"
  const headingSize = layoutKind === "oversized-typography" ? "7xl" : layoutKind === "editorial-passage" || context.instanceScale === "large" ? "5xl" : undefined
  const heading = showHeader ? headingNode(nodes, "Titulo products", copy.title, 2, { align, color: textColors.heading, ...(headingSize ? { size: headingSize } : {}) }) : null
  const intro = showHeader && copy.intro ? textNode(nodes, "Intro products", copy.intro, { align, size: "lg", color: textColors.body }) : null

  const action = context.commerceCtaAction && !context.instanceOmitCta
    ? add(nodes, createComposedNode({ type: "ctaButton", displayName: "Accion products", props: { label: context.commerceCtaAction.label, href: context.commerceCtaAction.href, variant: "secondary", size: "md" } }))
    : null

  let children: string[]
  let layoutVariant = "store-product-cards"
  if (isSplit) {
    layoutVariant = mirrored ? "store-mirror-split" : "store-editorial-split"
    const textColumn = wrapperNode(nodes, "Texto products", "flex flex-col justify-center gap-5", [heading, intro, action].filter((id): id is string => Boolean(id)))
    const cardsColumn = wrapperNode(nodes, "Grid productos tienda", storeCardsGridClass(context, true), cards)
    const columns = mirrored ? [cardsColumn, textColumn] : [textColumn, cardsColumn]
    children = [wrapperNode(nodes, "Split products", "grid items-center gap-10 lg:grid-cols-2", columns)]
  } else if (layoutKind === "editorial-passage") {
    layoutVariant = "store-editorial-passage"
    const header = wrapperNode(nodes, "Encabezado products", "mx-auto flex max-w-3xl flex-col gap-4", [heading, intro].filter((id): id is string => Boolean(id)))
    const stack = wrapperNode(nodes, "Grid productos tienda", "mx-auto grid max-w-3xl gap-6", cards)
    children = [header, stack, ...(action ? [wrapperNode(nodes, "Acciones products", "mt-8 flex justify-center", [action])] : [])]
  } else {
    if (layoutKind === "oversized-typography") layoutVariant = "store-oversized-typography"
    const grid = wrapperNode(nodes, "Grid productos tienda", storeCardsGridClass(context, false), cards)
    children = [heading, intro, grid, ...(action ? [wrapperNode(nodes, "Acciones products", "mt-8 flex justify-center", [action])] : [])].filter((id): id is string => Boolean(id))
  }

  const paddingY = context.instanceScale === "condensed" || context.aiSectionToneStrategy === "soft-rhythm" ? "lg" : "xl"
  const maxWidth = context.instanceScale === "condensed" ? "lg" : "xl"
  const root = add(nodes, createComposedNode({
    type: "section",
    displayName: `${copy.title} (${layoutVariant})`,
    props: { maxWidth, paddingY, paddingX: "lg", background },
    children,
  }))
  return { role: "products", rootId: root, nodes, purpose: "Catalogo de productos de la tienda con carrito." }
}

function composeProducts(context: SectionCompositionContext = {}): ComposedSection {
  const products = context.products ?? []
  if (products.length > 0 && (products.every(isExecutableCommerceProductV1) || products.every((product) => Boolean(product.pendingProvisioning)))) {
    return composeStoreProductsSection(context, products)
  }
  return composeLegacyProducts(products.length ? { ...context, products: products.map(withPresentationCommerceFacts) } : context)
}

function composeLegacyProducts(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("products", "Productos destacados", "Muestra opciones faciles de comparar y listas para llevar al usuario a comprar.", [["Producto estrella", "Describe el beneficio principal, precio o diferencial."], ["Opcion recomendada", "Resalta el producto ideal para la mayoria de clientes."], ["Paquete premium", "Presenta la alternativa con mayor valor percibido."]], context) }
function composePricing(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("pricing", "Elige la opcion ideal", "Presenta precios, paquetes u ofertas sin confundir al comprador.", [["Inicial", "Para comenzar con lo esencial y validar interes."], ["Recomendado", "La opcion con mejor balance entre alcance, soporte y crecimiento."], ["Premium", "Para clientes que quieren una experiencia mas completa."]], context) }

/**
 * The "contact" role is used two ways: as Contacto's ONLY content section
 * (archetype="conversion" -- that page has no separate "hero" role in any
 * architecture recipe, so this IS its purpose-bearing header), and as a
 * supplementary mid-page block on Home (which already has its own hero
 * H1). Only the former should gain a real H1 / conversion copy / second
 * CTA -- giving both would produce two H1s and an unreviewed extra CTA on
 * Home. The conversion-only branch deliberately reuses
 * getPageAwareHeroCopy's existing conversion-archetype copy (already
 * location+objective aware) instead of composeHero's full 2-column
 * structure, keeping Contacto materially shorter than Home/Servicios.
 */
function composeContact(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const isConversionPage = context.archetype === "conversion"
  /*
   * V2-6.1: a CompositionPlan contact instance whose backgroundStrategy
   * directive is "contrast-led" matches the CTA section's dark surface
   * (see composeCTA) so the two visually read as one composed closing
   * moment, without inventing a merged contact+CTA node type. Every
   * existing caller leaves this unset -> byte-identical light card.
   */
  /*
   * V2-6.2: DRAMATIC CLOSING implies the same dark, CTA-matching surface
   * as the V2-6.1 backgroundStrategy:"contrast-led" mechanism -- a plan
   * author requesting the primitive does not also have to separately
   * request the background strategy for the two to actually match.
   */
  const isDramaticClosing = context.instanceVisualPrimitive === "dramatic-closing"
  const useContrastBackground = context.instanceContrastBackground === true || isDramaticClosing
  const closingBackground = "#0A3E57"
  const closingTextColors = readableTextColorsFor(closingBackground)

  let titleText = "Hablemos de tu proyecto"
  let descriptionText =
    "Deja claro el siguiente paso y facilita que el visitante te escriba, agende o solicite una cotizacion."

  if (isConversionPage) {
    const heroCopy = getPageAwareHeroCopy({
      name: context.businessName,
      location: context.location,
      objective: context.businessObjective,
      page: {
        name: context.pageName,
        slug: context.pageSlug ?? "contacto",
        purpose: context.pagePurpose,
        archetype: "conversion",
      },
    })
    titleText = heroCopy.title
    descriptionText = heroCopy.description
  }

  const bookingPresentation = context.aiPreferredBookingPresentation && (BOOKING_PRESENTATIONS as readonly string[]).includes(context.aiPreferredBookingPresentation) ? context.aiPreferredBookingPresentation : undefined
  const headingText = bookingPresentation === "booking-card" ? "Agenda el siguiente paso" : titleText
  const heading = isDramaticClosing
    ? headingNode(nodes, "Titulo contacto", headingText, isConversionPage ? 1 : 2, { align: "left", size: "6xl", weight: "extrabold", color: closingTextColors.heading })
    : headingNode(nodes, "Titulo contacto", headingText, isConversionPage ? 1 : 2, { align: "left", ...(useContrastBackground ? { color: closingTextColors.heading } : {}) })
  const copy = textNode(nodes, "Texto contacto", bookingPresentation === "booking-card" ? "Solicita una cita o conversación y confirma los detalles directamente con el negocio." : descriptionText, { size: "lg", ...(useContrastBackground ? { color: closingTextColors.body } : {}) })

  // V2-5F: real, caller-supplied contact only. When any real contact value
  // exists, never pad it out with the placeholder phone/email below --
  // that would falsely imply invented details belong to this business.
  const realContact = context.businessEvidence?.contact
  const hasRealContact = Boolean(realContact?.whatsapp || realContact?.phone || realContact?.email)
  const contactLineProps = useContrastBackground ? { color: closingTextColors.body } : {}

  const contactLineIds = hasRealContact
    ? [
        realContact?.whatsapp ? textNode(nodes, "WhatsApp", `WhatsApp: ${realContact.whatsapp}`, contactLineProps) : null,
        realContact?.phone ? textNode(nodes, "Telefono", `Telefono: ${realContact.phone}`, contactLineProps) : null,
        realContact?.email ? textNode(nodes, "Correo", `Correo: ${realContact.email}`, contactLineProps) : null,
      ].filter((id): id is string => Boolean(id))
    : [
        textNode(nodes, "Telefono", "WhatsApp: +52 000 000 0000", contactLineProps),
        textNode(nodes, "Correo", "Correo: contacto@tumarca.com", contactLineProps),
      ]

  const primaryHref = realContact?.whatsapp ? `https://wa.me/${realContact.whatsapp}` : "#"
  const primaryCta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "Boton contacto", props: { label: bookingPresentation === "booking-card" ? "Solicitar cita" : "Enviar mensaje", href: primaryHref, variant: "primary", size: "lg" } }))

  const contentChildren = [heading, copy, ...contactLineIds]

  if (isConversionPage) {
    const secondaryCta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "Boton contacto secundario", props: { label: "Ver servicios", href: "#servicios", variant: "secondary", size: "lg" } }))
    const actions = wrapperNode(nodes, "Acciones contacto", "flex flex-col gap-3 sm:flex-row", [primaryCta, secondaryCta])
    contentChildren.push(actions)
  } else {
    contentChildren.push(primaryCta)
  }

  const bookingNote = bookingPresentation === "booking-card" ? textNode(nodes, "Nota reserva", "Los detalles se confirman directamente al contactar.", { size: "sm", color: "#64748b" }) : null
  if (bookingNote) contentChildren.push(bookingNote)

  /*
   * V2-6.2: DRAMATIC CLOSING drops the bordered/translucent card entirely
   * -- content sits directly on the shared dark surface, exactly like
   * composeCTA's banner variant already does, so the two sections that
   * follow each other read as ONE continuous closing surface instead of
   * two adjacent boxes. Every other path (including the pre-existing
   * V2-6.1 contrast-led-without-primitive case) keeps its card exactly
   * as before.
   */
  const card = isDramaticClosing
    ? wrapperNode(nodes, "Contenido cierre dramatico", "mx-auto flex w-full max-w-4xl flex-col gap-6", contentChildren, "article")
    : wrapperNode(
        nodes,
        "Tarjeta contacto",
        useContrastBackground
          ? "rounded-[1.75rem] border border-white/10 bg-white/5 p-8"
          : bookingPresentation === "booking-card"
            ? "rounded-[2rem] border border-sky-200 bg-white p-8 shadow-2xl shadow-sky-900/10"
            : "rounded-[1.75rem] border border-sky-100 bg-white p-8 shadow-xl shadow-sky-900/10",
        contentChildren,
        "article",
      )
  const root = add(nodes, createComposedNode({
    type: "section",
    displayName: isDramaticClosing ? "Contacto (dramatic-closing)" : "Contacto",
    props: {
      maxWidth: isDramaticClosing ? "full" : "lg",
      paddingY: "xl",
      paddingX: "lg",
      background: useContrastBackground ? closingBackground : "#eef8ff",
    },
    children: [card],
  }))
  return { role: "contact", rootId: root, nodes, purpose: "Facilitar contacto y siguiente paso." }
}

function ctaCopy(archetype: SectionCompositionContext["archetype"]) {
  if (archetype === "overview") {
    return {
      title: "Descubre todo lo que podemos hacer por ti",
      body: "Conoce el detalle completo de nuestros servicios y encuentra la opcion ideal.",
      label: "Ver servicios",
      href: "#servicios",
    }
  }

  if (archetype === "catalog") {
    return {
      title: "¿Listo para dar el siguiente paso?",
      body: "Agenda una valoracion y resolvemos juntos cual es la mejor opcion para ti.",
      label: "Agendar ahora",
      href: "#contacto",
    }
  }

  return {
    title: "Convierte esta visita en una oportunidad real",
    body: "Cierra con una accion clara, directa y facil de tomar.",
    label: "Comenzar ahora",
    href: "#contacto",
  }
}

function composeCTA(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  /*
   * V2-S2 section 4: layers real, explicit facts (offering kind +
   * businessObjective) onto the existing archetype fallback. No facts ->
   * `copy` is `ctaCopy(context.archetype)` unchanged.
   */
  const copy = resolveCtaCopy(context, ctaCopy(context.archetype))
  /*
   * V2-6.2: DRAMATIC CLOSING deterministically uses the banner shape
   * (already full-width/dark/xl-padding, IDENTICAL outer shell to the
   * companion contact section above it) instead of the probabilistically-
   * selected variant -- the closing's visual continuity must not depend
   * on which variant selectVariant happens to land on.
   */
  const isDramaticClosing = context.instanceVisualPrimitive === "dramatic-closing"
  const variant = isDramaticClosing ? "banner" : selectVariant(context, "cta", CTA_VARIANTS, CTA_WEIGHTS)

  if (variant === "split-panel") {
    const heading = headingNode(nodes, "Titulo CTA", copy.title, 2, { align: "left", color: "#ffffff" })
    const body = textNode(nodes, "Texto CTA", copy.body, { align: "left", color: "#dbeafe", size: "lg" })
    const textStack = wrapperNode(nodes, "Texto CTA stack", "flex flex-col gap-4", [heading, body])
    const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: copy.label, href: copy.href, variant: "primary", size: "lg" } }))
    const actionWrap = wrapperNode(nodes, "Accion CTA", "flex items-center justify-start lg:justify-end", [cta])
    const panel = wrapperNode(nodes, "Panel CTA", "mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.3fr_1fr]", [textStack, actionWrap])
    const root = add(nodes, createComposedNode({ type: "section", displayName: "CTA final (panel)", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [panel] }))
    return { role: "cta", rootId: root, nodes, purpose: "Cerrar con llamada a la accion." }
  }

  const heading = headingNode(nodes, "Titulo CTA", copy.title, 2, { align: "center", color: "#ffffff", ...(isDramaticClosing ? { size: "6xl" as const } : {}) })
  const body = textNode(nodes, "Texto CTA", copy.body, { align: "center", color: "#dbeafe", size: "lg" })
  const cta = add(nodes, createComposedNode({ type: "ctaButton", displayName: "CTA final", props: { label: copy.label, href: copy.href, variant: "primary", size: "lg" } }))
  const stack = wrapperNode(nodes, "Contenido CTA", `mx-auto flex ${isDramaticClosing ? "max-w-4xl" : "max-w-3xl"} flex-col items-center gap-6 text-center`, [heading, body, cta])
  const root = add(nodes, createComposedNode({ type: "section", displayName: isDramaticClosing ? "CTA final (dramatic-closing)" : "CTA final (banner)", props: { maxWidth: "full", paddingY: "xl", paddingX: "lg", background: "#0A3E57" }, children: [stack] }))
  return { role: "cta", rootId: root, nodes, purpose: "Cerrar con llamada a la accion." }
}

/**
 * Legacy fallback nav text, preserved verbatim for callers that don't
 * supply sitePages (eg. pre-existing tests, non-multipage composition).
 */
const FOOTER_NAV_FALLBACK = "Inicio · Servicios · Precios · Contacto"

function footerNavText(
  sitePages: SectionCompositionContext["sitePages"],
): string {
  const names = (sitePages ?? [])
    .map((page) => page.name?.trim())
    .filter((name): name is string => Boolean(name))

  return names.length ? names.join(" · ") : FOOTER_NAV_FALLBACK
}

function composeFooter(
  context: SectionCompositionContext = {},
): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const brandName = context.businessName?.trim() || "Nombre del negocio"
  const brand = headingNode(nodes, "Marca footer", brandName, 3, { size: "xl", color: "#ffffff" })
  const copy = textNode(nodes, "Descripcion footer", "Gracias por tu visita. Contactanos para conocer mas.", { color: "#cbd5e1" })
  const links = textNode(nodes, "Links footer", footerNavText(context.sitePages), { color: "#e2e8f0" })
  const brandStack = wrapperNode(nodes, "Marca y descripcion", "space-y-3", [brand, copy])
  const stack = wrapperNode(nodes, "Contenido footer", "mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center", [brandStack, links])
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Footer", props: { maxWidth: "full", paddingY: "lg", paddingX: "lg", background: "#071826" }, children: [stack] }))
  return { role: "footer", rootId: root, nodes, purpose: "Cerrar navegacion, marca y datos basicos." }
}

/**
 * COMMERCE-3C: a commerce discovery row. Labels are the REAL product
 * categories; every href is an Orvenix-resolved `page:<generated category
 * page>` (validated in composition-plan.ts). Replaces the generic
 * placeholder content grid whenever real category destinations exist.
 */
function composeCategoryLinks(context: SectionCompositionContext, links: NonNullable<SectionCompositionContext["commerceCategoryLinks"]>): ComposedSection {
  const nodes: Record<string, ComposedNode> = {}
  const minimal = context.instanceNarrativeIntent === "minimal-introduction"
  const heading = headingNode(nodes, "Titulo categorias", minimal ? "Categorías" : "Explora por categoría", 2, { align: "center" })
  const intro = minimal ? null : textNode(nodes, "Intro categorias", "Elige una categoría para ver sus productos.", { align: "center", size: "lg" })
  const buttons = links.map((link, index) => add(nodes, createComposedNode({ type: "ctaButton", displayName: `Categoria ${index + 1}`, props: { label: link.label, href: link.href, variant: "secondary", size: context.instanceScale === "large" ? "lg" : "md" } })))
  const row = wrapperNode(nodes, "Enlaces categorias", context.instanceScale === "condensed" ? "flex flex-wrap justify-center gap-2" : "flex flex-wrap justify-center gap-3", buttons)
  const root = add(nodes, createComposedNode({ type: "section", displayName: "Categorias (category-links)", props: { maxWidth: "xl", paddingY: context.instanceScale === "condensed" ? "lg" : "xl", paddingX: "lg", background: "#ffffff" }, children: [heading, intro, row].filter((id): id is string => Boolean(id)) }))
  return { role: "content", rootId: root, nodes, purpose: "Descubrir categorias reales de la tienda." }
}

function composeContent(context: SectionCompositionContext = {}): ComposedSection {
  if (context.commerceCategoryLinks?.length) return composeCategoryLinks(context, context.commerceCategoryLinks)
  return composeGenericContent(context)
}

function composeGenericContent(context: SectionCompositionContext = {}): ComposedSection { return composeCardGridSection("content", "Contenido principal", "Informacion clara y organizada sobre lo que ofrecemos.", [["Detalle importante", "Explica aqui un punto clave que ayude a decidir."], ["Diferencial", "Cuenta que hace especial esta oferta frente a otras opciones."], ["Siguiente paso", "Guia al visitante hacia la accion mas importante."]], context) }

function removeComposedNodes(section: ComposedSection, predicate: (node: ComposedNode) => boolean): void {
  const removed = new Set(Object.values(section.nodes).filter(predicate).map((node) => node.tempId))
  if (!removed.size) return
  for (const id of removed) delete section.nodes[id]
  for (const node of Object.values(section.nodes)) node.children = node.children.filter((child) => !removed.has(child))
}

const COMMERCE_CLOSING_COPY: Record<SectionInstanceCtaLabel, { title: string; body: string }> = {
  "Ver catálogo": { title: "Descubre todo el catálogo", body: "Encuentra más productos en la tienda." },
  "Ver categoría": { title: "Explora otra categoría", body: "Recorre más productos de la tienda." },
  "Ver producto": { title: "Conoce el producto", body: "Revisa el detalle, el precio y la disponibilidad." },
  "Seguir explorando": { title: "Sigue explorando la tienda", body: "Encuentra más productos en la tienda." },
  "Ver ayuda": { title: "¿Tienes dudas?", body: "Revisa la página de ayuda de la tienda." },
}

/**
 * COMMERCE-3C: post-composition, bounded consumers for commerce creative
 * intent on hero/closing sections -- applied to the composer's own output,
 * whatever variant it chose. Only Orvenix-owned labels/copy and
 * `page:<generated slug>` hrefs are written; with no commerce intent in
 * the context this is a strict no-op.
 */
function applyCommerceIntentToSection(role: SectionRole, section: ComposedSection, context: SectionCompositionContext): ComposedSection {
  if (role !== "hero" && role !== "cta") return section
  if (context.instanceOmitCta) {
    removeComposedNodes(section, (node) => node.type === "ctaButton")
  } else if (context.commerceCtaAction) {
    const buttons = Object.values(section.nodes).filter((node) => node.type === "ctaButton")
    if (buttons[0]) buttons[0].props = { ...buttons[0].props, label: context.commerceCtaAction.label, href: context.commerceCtaAction.href }
    const extra = new Set(buttons.slice(1).map((node) => node.tempId))
    removeComposedNodes(section, (node) => extra.has(node.tempId))
    if (role === "cta") {
      const copy = COMMERCE_CLOSING_COPY[context.commerceCtaAction.label]
      for (const node of Object.values(section.nodes)) {
        if (node.displayName === "Titulo CTA") node.props = { ...node.props, text: copy.title }
        if (node.displayName === "Texto CTA") node.props = { ...node.props, content: copy.body }
      }
    }
  }
  if (role === "hero" && context.instanceNarrativeIntent === "minimal-introduction") {
    removeComposedNodes(section, (node) => node.displayName === "Descripcion hero" || node.displayName === "Etiqueta hero")
  }
  return section
}

export function composeSection(
  role: SectionRole,
  context: SectionCompositionContext = {},
): ComposedSection | null {
  const section = composeSectionForRole(role, context)
  return section && (context.commerceCtaAction || context.instanceOmitCta || context.instanceNarrativeIntent)
    ? applyCommerceIntentToSection(role, section, context)
    : section
}

function composeSectionForRole(
  role: SectionRole,
  context: SectionCompositionContext = {},
): ComposedSection | null {
  switch (role) {
    case "navigation":
      return composeNavigation(context)

    case "hero":
      return composeHero(context)

    case "services":
      return composeServices(context)

    case "features":
      return composeFeatures(context)

    case "products":
      return composeProducts(context)

    case "pricing":
      return composePricing(context)

    case "process":
      return composeProcess(context)

    case "contact":
      return composeContact(context)

    case "cta":
      return composeCTA(context)

    case "footer":
      return composeFooter(context)

    case "content":
      return composeContent(context)

    case "faq":
      return composeFAQ(context)

    case "gallery":
      return composeGallery(context)

    case "trust":
      return composeTrust(context)

    case "testimonials":
      return composeTestimonials(context)

    default:
      return null
  }
}
