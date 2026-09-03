import {
  randomUUID,
} from "crypto"

import {
  getEditorTreeFromDb,
} from "@/lib/editorPersistence"

import {
  getDefaultStarterEditorTree,
} from "@/lib/editorWebs"

import {
  getResolvedSiteTheme,
} from "@/lib/builder-core/tree/sitePages"

import {
  planThemeMutation,
} from "@/lib/orvenix-ai/theme"

import {
  planDesignMutation,
} from "@/lib/orvenix-ai/design"

import {
  runAutonomousSiteBuilder,
} from "@/lib/orvenix-ai/autonomous"

import {
  getConversationContext,
  rememberConversationTurn,
  resolveContextualTarget,
} from "@/lib/orvenix-ai/context"

import {
  parseSectionIntent,
  discoverRootSection,
  canExecuteDestructiveSectionOperation,
} from "@/lib/orvenix-ai/section"

import {
  planSectionMutation,
} from "@/lib/orvenix-ai/section"

import {
  buildArtisanInspiredFallbackTree,
  detectArtisanSectionIntent,
  type ArtisanSectionIntent,
} from "@/lib/orvenix-ai/section/artisan-section-references"

import {
  detectMutationScope,
  evaluateMutationPolicy,
} from "@/lib/orvenix-ai/policy"

import {
  createRealSiteDryRun,
  applyMutation,
} from "@/lib/orvenix-ai/mutation"

import {
  evaluateTreeQuality,
} from "@/lib/orvenix-ai/quality"

import {
  planLocalMutation,
} from "@/lib/orvenix-ai/local"

import {
  planMultiMutation,
} from "@/lib/orvenix-ai/multi"

import {
  createDryRunMutationPlan,
} from "@/lib/orvenix-ai/mutation"

import type {
  EditorTree,
} from "@/types/editor"

import type {
  OrvenixAgentExecutionContext,
  OrvenixAgentRequest,
  OrvenixAgentResponse,
} from "./types"

function cloneGeneratedSectionNodeId(kind: "root" | "node") {
  return kind === "root"
    ? `ai-section-autonomous-${randomUUID()}`
    : `ai-section-node-${randomUUID()}`
}

function cloneTheme<T>(theme: T): T {
  return structuredClone(theme)
}

function normalizeSiteCreationTreeTheme(tree: EditorTree, starterTree: EditorTree): EditorTree {
  const sourceTheme = tree.theme ?? tree.globalTheme ?? starterTree.theme ?? starterTree.globalTheme

  if (!sourceTheme) return tree

  return {
    ...tree,
    theme: cloneTheme(sourceTheme),
    globalTheme: cloneTheme(sourceTheme),
  }
}

function sectionLooksLikeRole(
  tree: EditorTree,
  sectionId: string,
  role: string,
) {
  const section = tree.nodes[sectionId]

  if (!section) {
    return false
  }

  const text = normalizeAgentRequest(
    [
      section.id,
      section.type,
      section.displayName ?? "",
      ...collectSectionText(tree, sectionId),
    ].join(" "),
  )

  const aliases: Record<string, string[]> = {
    navigation: ["sitenav", "site nav", "navigation", "navegacion", "menu", "navbar", "header"],
    hero: ["hero", "portada", "inicio", "principal"],
    services: ["servicios", "services", "soluciones"],
    gallery: ["galeria", "gallery", "portfolio", "portafolio", "proyectos", "casos visuales"],
    pricing: ["pricing", "precios", "planes", "paquetes", "tarifas"],
    testimonials: ["testimonios", "testimonials", "resenas", "reviews", "clientes"],
    contact: ["contacto", "contact", "agenda", "whatsapp"],
    cta: ["cta", "conversion", "cierre"],
    footer: ["footer", "pie de pagina"],
  }

  return (aliases[role] ?? [role]).some((alias) => text.includes(alias))
}

function collectSectionText(tree: EditorTree, sectionId: string) {
  const result: string[] = []
  const visited = new Set<string>()

  function visit(nodeId: string) {
    if (visited.has(nodeId)) {
      return
    }

    const node = tree.nodes[nodeId]

    if (!node) {
      return
    }

    visited.add(nodeId)
    result.push(String(node.type ?? ""))
    result.push(String(node.displayName ?? ""))

    for (const value of Object.values(node.props ?? {})) {
      if (typeof value === "string") {
        result.push(value)
      }
    }

    for (const childId of node.children ?? []) {
      visit(childId)
    }
  }

  visit(sectionId)

  return result
}

function findSectionIndexByRole(
  tree: EditorTree,
  role: string,
) {
  const root = tree.nodes[tree.rootId]

  if (!root) {
    return -1
  }

  return (root.children ?? []).findIndex((sectionId) =>
    sectionLooksLikeRole(tree, sectionId, role),
  )
}

function resolveContextualInsertionIndex(params: {
  tree: EditorTree
  intent: ArtisanSectionIntent
}) {
  const root = params.tree.nodes[params.tree.rootId]
  const children = root?.children ?? []

  if (children.length === 0) {
    return 0
  }

  const find = (role: string) =>
    findSectionIndexByRole(params.tree, role)

  const navIndex = find("navigation")
  const heroIndex = find("hero")
  const servicesIndex = find("services")
  const galleryIndex = find("gallery")
  const pricingIndex = find("pricing")
  const testimonialsIndex = find("testimonials")
  const contactIndex = find("contact")
  const ctaIndex = find("cta")
  const footerIndex = find("footer")

  if (params.intent === "navigation") {
    return navIndex >= 0 ? navIndex : 0
  }

  if (params.intent === "hero") {
    if (heroIndex >= 0) return heroIndex + 1
    return navIndex >= 0 ? navIndex + 1 : 0
  }

  if (params.intent === "services") {
    if (servicesIndex >= 0) return servicesIndex + 1
    if (galleryIndex >= 0) return galleryIndex
    if (pricingIndex >= 0) return pricingIndex
    return heroIndex >= 0 ? heroIndex + 1 : children.length
  }

  if (params.intent === "gallery") {
    if (galleryIndex >= 0) return galleryIndex + 1
    if (testimonialsIndex >= 0) return testimonialsIndex
    if (pricingIndex >= 0) return pricingIndex
    return servicesIndex >= 0 ? servicesIndex + 1 : children.length
  }

  if (params.intent === "pricing") {
    if (pricingIndex >= 0) return pricingIndex + 1
    if (contactIndex >= 0) return contactIndex
    if (ctaIndex >= 0) return ctaIndex
    if (footerIndex >= 0) return footerIndex
    return children.length
  }

  if (params.intent === "testimonials") {
    if (testimonialsIndex >= 0) return testimonialsIndex + 1
    if (pricingIndex >= 0) return pricingIndex
    if (contactIndex >= 0) return contactIndex
    if (footerIndex >= 0) return footerIndex
    return children.length
  }

  if (params.intent === "contact") {
    if (contactIndex >= 0) return contactIndex + 1
    if (footerIndex >= 0) return footerIndex
    return children.length
  }

  return children.length
}

function appendGeneratedSection(params: {
  before: EditorTree
  generated: EditorTree
  intent: ArtisanSectionIntent
}) {
  const next = structuredClone(params.before)
  const root = next.nodes[next.rootId]

  if (!root) {
    return null
  }

  const idMap = new Map<string, string>()

  for (const sourceId of Object.keys(params.generated.nodes)) {
    idMap.set(
      sourceId,
      cloneGeneratedSectionNodeId(
        sourceId === params.generated.rootId
          ? "root"
          : "node",
      ),
    )
  }

  for (const source of Object.values(params.generated.nodes)) {
    const id = idMap.get(source.id)

    if (!id) {
      return null
    }

    next.nodes[id] = {
      ...structuredClone(source),
      id,
      parentId: undefined,
      children: (source.children ?? [])
        .map((childId) => idMap.get(childId))
        .filter((childId): childId is string => Boolean(childId)),
    }
  }

  for (const source of Object.values(params.generated.nodes)) {
    const parentId = idMap.get(source.id)

    if (!parentId) {
      continue
    }

    for (const sourceChildId of source.children ?? []) {
      const childId = idMap.get(sourceChildId)
      const child = childId
        ? next.nodes[childId]
        : null

      if (child) {
        child.parentId = parentId
      }
    }
  }

  const rootSectionId = idMap.get(params.generated.rootId)

  if (!rootSectionId) {
    return null
  }

  next.nodes[rootSectionId].parentId = root.id
  const insertIndex = Math.max(
    0,
    Math.min(
      resolveContextualInsertionIndex({
        tree: params.before,
        intent: params.intent,
      }),
      root.children?.length ?? 0,
    ),
  )

  root.children = [...(root.children ?? [])]
  root.children.splice(insertIndex, 0, rootSectionId)

  return {
    tree: next,
    rootSectionId,
    addedNodeIds: [...idMap.values()],
    changedNodeIds: [root.id],
  }
}

function normalizeAgentRequest(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

function shouldUseAutonomousSectionComposer(request: string) {
  const text = normalizeAgentRequest(request)

  const creativeIntent = [
    "crea",
    "crear",
    "genera",
    "generar",
    "disena",
    "disenar",
    "haz una seccion",
    "hazme una seccion",
    "arma una seccion",
    "construye",
  ].some((value) => text.includes(value))

  const businessContext = [
    "restaurante",
    "clinica",
    "doctor",
    "abogado",
    "contador",
    "inmobiliaria",
    "tienda",
    "ecommerce",
    "producto",
    "artesanal",
    "premium",
    "profesional",
  ].some((value) => text.includes(value))

  return creativeIntent && businessContext
}

function findFirstNodeByType(
  tree: EditorTree,
  type: string,
) {
  return Object.values(tree.nodes).find((node) => node.type === type) ?? null
}

function buildNavigationMutation(params: {
  before: EditorTree
  request: string
}) {
  const nav = findFirstNodeByType(params.before, "siteNav")

  if (!nav) {
    return null
  }

  const next = structuredClone(params.before)
  const nextNav = next.nodes[nav.id]

  if (!nextNav) {
    return null
  }

  const text = normalizeAgentRequest(params.request)
  const wantsLight =
    text.includes("claro") ||
    text.includes("light") ||
    text.includes("limpio")
  const wantsMinimal =
    text.includes("minimal") ||
    text.includes("simple") ||
    text.includes("integrado")

  nextNav.props = {
    ...nextNav.props,
    title: typeof nextNav.props.title === "string"
      ? nextNav.props.title
      : "Navegación principal",
    subtitle: "Sitio profesional",
    showHome: true,
    showCta: true,
    ctaLabel: text.includes("reserv")
      ? "Reservar"
      : text.includes("compr")
        ? "Comprar ahora"
        : "Contactar",
    ctaHref: "page:contacto",
    layout: "row",
    justify: "start",
    variant: wantsMinimal ? "minimal" : "pill",
    surface: wantsLight ? "light" : nextNav.props.surface ?? "dark",
    chrome: "integrated",
  }

  return {
    ok: true,
    tree: next,
    role: "navigation" as const,
    rootSectionId: nav.parentId,
    addedNodeIds: [],
    removedNodeIds: [],
    changedNodeIds: [nav.id],
    warnings: [
      "Se actualizó el menú existente en su posición actual.",
    ],
  }
}

function buildAutonomousSectionMutation(params: {
  before: EditorTree
  request: string
}) {
  const intent = detectArtisanSectionIntent(params.request)
  if (intent === "navigation") {
    const navigation = buildNavigationMutation(params)

    if (navigation) {
      return navigation
    }
  }

  const generated = buildArtisanInspiredFallbackTree(
    `agent-section-${randomUUID()}`,
    params.request,
    intent,
  )

  const appended = appendGeneratedSection({
    before: params.before,
    generated,
    intent,
  })

  if (!appended) {
    return null
  }

  return {
    ok: true,
    tree: appended.tree,
    role: intent,
    rootSectionId: appended.rootSectionId,
    addedNodeIds: appended.addedNodeIds,
    removedNodeIds: [],
    changedNodeIds: appended.changedNodeIds,
    warnings: [
      "Se generó una sección editable y se colocó en su área correspondiente.",
    ],
  }
}

function defaultModeForScope(
  scope: ReturnType<typeof detectMutationScope>,
) {
  switch (scope) {
    case "read_only":
      return "analyze" as const

    case "theme_edit":
      return "preview" as const

    case "local_edit":
    case "multi_edit":
    case "section_edit":
    case "site_creation":
    case "page_redesign":
    case "site_redesign":
    case "publish":
    case "design_edit":
      return "preview" as const
  }
}

export async function runOrvenixAgent(
  input: OrvenixAgentRequest,

  executionContext:
    OrvenixAgentExecutionContext = {},
): Promise<OrvenixAgentResponse> {
  const pageSlug =
  input.pageSlug ?? "home"

let resolvedTargetNodeId =
  input.targetNodeId

let resolvedTargetSectionId =
  input.targetSectionId

let scope =
  detectMutationScope(
    input.message,
  )

/*
 * CONTEXTUAL TARGET RESOLUTION
 *
 * Solo se utiliza cuando el usuario no
 * proporcionó un target explícito.
 */
if (
  scope !== "site_creation" &&
  !resolvedTargetNodeId &&
  !resolvedTargetSectionId
) {
  const conversation =
    getConversationContext(
      input.siteId,
      pageSlug,
    )

  const contextualTree =
    await getEditorTreeFromDb(
      input.siteId,
      pageSlug,
    )

  const contextual =
    resolveContextualTarget({
      message:
        input.message,

      tree:
        contextualTree,

      context:
        conversation,
    })

  if (
    contextual.resolved &&
    contextual.target
  ) {
    if (
      contextual.target.kind ===
        "node" &&
      contextual.target.nodeId
    ) {
      resolvedTargetNodeId =
        contextual.target.nodeId

      /*
       * Una frase como:
       * "Ahora ponlo en azul"
       *
       * puede caer inicialmente en read_only
       * porque no repite "cambia".
       *
       * Si existe un target contextual
       * válido, sabemos que es una
       * operación local.
       */
      if (
        scope === "read_only"
      ) {
        scope = "local_edit"
      }
    }

    if (
      contextual.target.kind ===
        "section" &&
      contextual.target.sectionId
    ) {
      resolvedTargetSectionId =
        contextual.target.sectionId

      if (
        scope === "read_only"
      ) {
        scope = "section_edit"
      }
    }
  }
}

const mode =
  input.mode ??
  defaultModeForScope(scope)

  /*
   * READ ONLY
   */
  if (scope === "read_only") {
    const tree =
      await getEditorTreeFromDb(
        input.siteId,
        input.pageSlug ?? "home",
      )

    const quality =
      evaluateTreeQuality(tree)

    return {
      ok: true,
      action: "analysis",
      scope,

      message:
        `Analicé la página actual. Calidad estimada: ${quality.score}/100.`,

      tree,
      quality: quality.score,
      warnings: quality.problems,
    }
  }

  /*
 * SITE CREATION
 *
 * Crea un plan completo para un sitio nuevo sin tocar
 * ningun sitio existente durante Preview. La escritura real
 * solo ocurre por medio de createDraftSite, una capacidad
 * autenticada que inyecta el servidor.
 */
if (scope === "site_creation") {
  const business = input.business ?? {}

  const before = getDefaultStarterEditorTree()

  const generated = input.siteCreationPlan
    ? null
    : await runAutonomousSiteBuilder({
        request: input.message,
        business: {
          name: business.name ?? "Tu negocio",
          industry: business.industry ?? "negocio",
          location: business.location,
          description: business.description,
          audience: business.audience,
          objective: business.objective,
          phone: business.phone,
          whatsapp: business.whatsapp,
          email: business.email,
          address: business.address,
          services: business.services,
          pricing: business.pricing,
          testimonials: business.testimonials,
        },
        preferredStyle: input.business?.description ?? "sitio profesional editable",
        forceFreshComposition: true,
        minimumQuality: 55,
      })

  if (generated && !generated.ok) {
    return {
      ok: false,
      action: "blocked",
      scope,
      message: "Orvenix AI no pudo generar una propuesta válida para el sitio.",
      warnings: generated.warnings,
    }
  }

  const normalizedGeneratedTree = generated
    ? normalizeSiteCreationTreeTheme(generated.tree, before)
    : null
  const normalizedInputPlan = input.siteCreationPlan
    ? {
        ...input.siteCreationPlan,
        after: normalizeSiteCreationTreeTheme(input.siteCreationPlan.after, before),
      }
    : null

  const plan = normalizedInputPlan ??
    createDryRunMutationPlan({
      siteId: input.siteId,
      before,
      after: normalizedGeneratedTree!,
    })

  const policy = evaluateMutationPolicy({
    request: input.message,
    scopeOverride: scope,
    plan,
  })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,
      message: "Orvenix AI bloqueó la creación del sitio porque excede el alcance autorizado.",
      policy,
      plan,
      snapshot: plan.snapshot,
      warnings: policy.violations,
    }
  }

  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,
      message: `Sitio borrador preparado. Se agregarán ${plan.addedNodes} nodos editables y no se publicará automáticamente.`,
      policy,
      plan,
      snapshot: plan.snapshot,
      warnings: plan.warnings,
    }
  }

  if (mode === "execute" && policy.limits.requireConfirmation && !input.confirmed) {
    return {
      ok: true,
      action: "confirmation_required",
      scope,
      message: "La creación del sitio requiere confirmación explícita antes de guardar el borrador.",
      policy,
      plan,
      snapshot: plan.snapshot,
      warnings: plan.warnings,
    }
  }

  const createDraftSite = executionContext.createDraftSite

  if (!createDraftSite) {
    return {
      ok: false,
      action: "blocked",
      scope,
      message: "La creación del sitio requiere un contexto autenticado del servidor.",
      policy,
      plan,
      snapshot: plan.snapshot,
      warnings: [
        "El ejecutor autenticado de creación de borrador no fue proporcionado.",
      ],
    }
  }

  try {
    const createdSite = await createDraftSite({
      name: business.name?.trim() || "Sitio creado con Orvenix AI",
      description: [
        "created_from_scratch: orvenix_ai",
        business.industry ? `industry=${business.industry}` : null,
        business.location ? `location=${business.location}` : null,
      ].filter(Boolean).join("; "),
      tree: plan.after,
    })

    if (!createdSite.verified) {
      return {
        ok: false,
        action: "blocked",
        scope,
        message: "El sitio borrador se creó pero no pudo verificarse.",
        policy,
        plan,
        snapshot: plan.snapshot,
        createdSite,
        warnings: [
          "Falló la verificación posterior a la creación del borrador.",
        ],
      }
    }

    return {
      ok: true,
      action: "executed",
      scope,
      message: "Sitio borrador creado y verificado. Puedes abrirlo en el editor para revisarlo antes de publicar.",
      policy,
      plan,
      snapshot: plan.snapshot,
      createdSite,
      warnings: plan.warnings,
    }
  } catch (error) {
    return {
      ok: false,
      action: "blocked",
      scope,
      message: "No se pudo crear el sitio borrador.",
      policy,
      plan,
      snapshot: plan.snapshot,
      warnings: [
        error instanceof Error ? error.message : "El ejecutor autenticado de creación falló.",
      ],
    }
  }
}

  /*
 * THEME EDIT
 *
 * Los cambios globales de diseño se
 * representan también dentro del árbol.
 *
 * De esta manera reutilizamos:
 *
 * - Dry Run
 * - Safety
 * - Policy
 * - Snapshot
 * - Executor
 * - Verification
 * - Rollback
 *
 * sin crear una segunda infraestructura.
 */
if (scope === "theme_edit") {
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      pageSlug,
    )

  /*
   * SiteTheme es la fuente resuelta
   * y canónica para preparar la mutación.
   */
  const resolvedTheme =
    await getResolvedSiteTheme(
      input.siteId,
    )

  const theme =
    planThemeMutation({
      theme:
        resolvedTheme.tokens,

      request:
        input.message,
    })

  if (!theme.ok) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        theme.warnings[0] ??
        "No pude preparar la modificación global de diseño.",

      warnings:
        theme.warnings,
    }
  }

  /*
   * Copia del árbol para Dry Run.
   *
   * Mantenemos theme y globalTheme
   * sincronizados porque actualmente
   * existen consumidores de ambos.
   */
  const after =
    structuredClone(
      before,
    )

  after.theme =
    structuredClone(
      theme.afterTheme,
    )

  after.globalTheme =
    structuredClone(
      theme.afterTheme,
    )

  /*
   * El plan estándar nos da snapshot,
   * safety y compatibilidad con executor.
   */
  const plan =
    createDryRunMutationPlan({
      siteId:
        input.siteId,

      before,

      after,
    })

  const policy =
    evaluateMutationPolicy({
      request:
        input.message,

      scopeOverride:
        scope,

      plan,
    })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó la modificación global de diseño.",

      policy,
      plan,

      warnings:
        policy.violations,
    }
  }
  /*
   * PREVIEW
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        `Cambio global preparado: ${theme.changedTokens.join(", ")}.`,

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        theme.warnings,
    }
  }

  /*
   * EXECUTE
   *
   * applyMutation persiste el árbol.
   * editorPersistence sincroniza además
   * el SiteTheme desde tree.theme.
   */
  const execution =
    await applyMutation({
      plan,
      pageSlug,
    })

  if (!execution.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "La modificación global se ejecutó pero no pudo verificarse.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings: [
        "Falló la verificación posterior de Theme.",
      ],
    }
  }

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      `Theme actualizado correctamente: ${theme.changedTokens.join(", ")}.`,

    policy,
    plan,

    snapshot:
      plan.snapshot,

    warnings:
      theme.warnings,
  }
}

/*
 * DESIGN EDIT
 *
 * Rediseño visual coordinado mediante recetas.
 * Puede modificar Theme y múltiples nodos,
 * pero no altera la estructura del árbol.
 */
if (scope === "design_edit") {
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      pageSlug,
    )

  const resolvedTheme =
    await getResolvedSiteTheme(
      input.siteId,
    )

  const design =
    planDesignMutation({
      tree:
        before,

      theme:
        resolvedTheme.tokens,

      request:
        input.message,
    })

  if (!design.ok) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        design.warnings[0] ??
        "No se pudo preparar el rediseño visual.",

      warnings:
        design.warnings,
    }
  }

  /*
   * Copia defensiva del resultado.
   * El planner ya sincroniza theme y globalTheme,
   * pero lo garantizamos antes del dry-run.
   */
  const after =
    structuredClone(
      design.afterTree,
    )

  after.theme =
    structuredClone(
      design.afterTheme,
    )

  after.globalTheme =
    structuredClone(
      design.afterTheme,
    )

  const plan =
    createDryRunMutationPlan({
      siteId:
        input.siteId,

      before,

      after,
    })

  const policy =
    evaluateMutationPolicy({
      request:
        input.message,

      scopeOverride:
        scope,

      plan,
    })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó el rediseño visual porque excede el alcance autorizado.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        policy.violations,
    }
  }

  /*
   * PREVIEW
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        `Rediseño ${design.intent} preparado: ${design.changedThemeTokens.length} tokens globales y ${design.multiChanges} cambios visuales.`,

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings: [
        ...design.warnings,
        ...plan.warnings,
      ],
    }
  }

  /*
   * EXECUTE
   */
  const execution =
    await applyMutation({
      plan,
      pageSlug,
    })

  if (!execution.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "El rediseño visual se escribió pero no pudo verificarse.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings: [
        "Falló la verificación posterior del rediseño visual.",
      ],
    }
  }

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      `Rediseño ${design.intent} aplicado y verificado: ${design.changedThemeTokens.length} tokens globales y ${design.multiChanges} cambios visuales.`,

    policy,
    plan,

    snapshot:
      plan.snapshot,

    warnings: [
      ...design.warnings,
      ...plan.warnings,
    ],
  }
}

/*
 * PUBLISH
 *
 * Publicar no es un rediseño ni una mutación
 * de contenido. El plan conserva exactamente
 * el árbol actual.
 *
 * La ejecución real permanecerá bloqueada
 * hasta recibir un contexto autenticado
 * creado por el servidor.
 */
if (scope === "publish") {
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      pageSlug,
    )

  const after =
    structuredClone(
      before,
    )

  const plan =
    createDryRunMutationPlan({
      siteId:
        input.siteId,

      before,

      after,
    })

  const policy =
    evaluateMutationPolicy({
      request:
        input.message,

      scopeOverride:
        scope,

      plan,

      explicitPublish:
        true,
    })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó la preparación de la publicación.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        policy.violations,
    }
  }

  /*
   * PREVIEW
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        "La publicación está preparada. El contenido del sitio no será reemplazado.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        plan.warnings,
    }
  }

  /*
   * CONFIRMATION
   */
  if (
    mode === "execute" &&
    policy.limits
      .requireConfirmation &&
    !input.confirmed
  ) {
    return {
      ok: true,
      action:
        "confirmation_required",
      scope,

      message:
        "La publicación está lista y requiere confirmación explícita.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        plan.warnings,
    }
  }

  /*
   * EXECUTE
   *
   * No se acepta identidad dentro del input
   * porque podría provenir del usuario.
   * La identidad debe llegar mediante un
   * contexto confiable del servidor.
   */

  const publishCapability =
    executionContext.publishSite

  if (!publishCapability) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "La publicación requiere un contexto autenticado del servidor.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings: [
        "El ejecutor autenticado de publicación no fue proporcionado.",
      ],
    }
  }

  try {
    const publication =
      await publishCapability({
        siteId:
          input.siteId,
      })

    return {
      ok: true,
      action: "executed",
      scope,

      message:
        `Sitio publicado correctamente en ${publication.url}.`,

      policy,
      plan,

      snapshot:
        plan.snapshot,

      publication,

      warnings:
        plan.warnings,
    }
  } catch (error) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "No se pudo publicar el sitio.",

      policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings: [
        error instanceof Error
          ? error.message
          : "El ejecutor autenticado de publicación falló.",
      ],
    }
  }
}

  /*
 * LOCAL EDIT
 *
 * Las modificaciones locales nunca pasan
 * por Autonomous Site Builder.
 */
if (scope === "local_edit") {
  const before =
  await getEditorTreeFromDb(
    input.siteId,
    pageSlug,
  )

const local =
  planLocalMutation({
    tree: before,

    request:
      input.message,

    targetNodeId:
      resolvedTargetNodeId,
  })

if (!local.ok) {
  return {
    ok: false,
    action: "blocked",
    scope,

    message:
      local.warnings[0] ??
      "No se pudo preparar la modificación local.",

    warnings:
      local.warnings,
  }
}

const plan =
  createDryRunMutationPlan({
    siteId:
      input.siteId,

    before,

    after:
      local.tree,
  })

const policy =
  evaluateMutationPolicy({
    request:
      input.message,

    scopeOverride:
      scope,

    plan,

    targetNodeId:
      local.target?.nodeId ??
      resolvedTargetNodeId,
  })

if (!policy.allowed) {
  return {
    ok: false,
    action: "blocked",
    scope,

    message:
      "Orvenix AI bloqueó la modificación local porque excede el alcance autorizado.",

    policy,
    plan,

    warnings:
      policy.violations,
  }
}

  /*
   * Preview solicitado explícitamente.
   */
  if (mode === "preview") {
  /*
   * Solo recordamos en preview si la
   * sección ya existe realmente en DB.
   *
   * ADD / DUPLICATE / REPLACE generan
   * IDs nuevos que todavía no existen
   * hasta que se ejecuten.
   */

  if (local.target) {
    rememberConversationTurn({
      siteId:
        input.siteId,

      pageSlug,

      turn: {
        message:
          input.message,

        scope,

        target: {
          kind:
            "node",

          nodeId:
            local.target.nodeId,

          nodeType:
            local.target.nodeType,

          pageSlug,

          confidence:
            "high",
        },

        action:
          "preview",

        createdAt:
          new Date().toISOString(),
      },
    })
  }

  return {
    ok: true,
    action: "preview",
    scope,

    message:
      `Cambio local preparado: ${plan.changedNodes} nodo modificado.`,

    policy,
    plan,

    warnings:
      plan.warnings,
  }
  }

  /*
   * Ejecución local.
   *
   * No requiere confirmación cuando Policy
   * la considera una operación segura.
   */
  const applied =
    await applyMutation({
      plan,

      pageSlug:
        input.pageSlug ?? "home",
    })

  if (!applied.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "El cambio local se escribió pero no pudo verificarse.",

      policy,
      plan,

      warnings: [
        "Falló la verificación posterior a la escritura.",
      ],
    }
  }

  if (local.target) {
  const target = {
    kind: "node" as const,
    nodeId: local.target.nodeId,
    nodeType: local.target.nodeType,
    pageSlug,
    confidence: "high" as const,
  }

  rememberConversationTurn({
    siteId: input.siteId,
    pageSlug,

    turn: {
      message: input.message,
      scope,
      target,
      action: "executed",
      createdAt: new Date().toISOString(),
    },

    successfulTarget:
      target,
  })
}

/*
 * Después de una escritura verificada
 * sí podemos recordar la sección nueva.
 *
 * REMOVE es la excepción porque ese
 * sectionId acaba de dejar de existir.
 */

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      `Cambio aplicado correctamente en ${local.target?.displayName ?? local.target?.nodeType ?? "el elemento seleccionado"}.`,

    policy,
    plan,
    snapshot:
      plan.snapshot,

    warnings:
      plan.warnings,
  }
}

/*
 * MULTI EDIT
 *
 * Modificaciones masivas sobre múltiples nodos
 * existentes sin alterar la estructura del árbol.
 */
if (scope === "multi_edit") {
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      pageSlug,
    )

  const multi =
    planMultiMutation({
      tree: before,
      request: input.message,
    })

  if (!multi.ok) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        multi.warnings[0] ??
        "No se pudo preparar la modificación múltiple.",

      warnings:
        multi.warnings,
    }
  }

  const plan =
    createDryRunMutationPlan({
      siteId:
        input.siteId,

      before,

      after:
        multi.tree,
    })

  const policy =
    evaluateMutationPolicy({
      request:
        input.message,

      scopeOverride:
        scope,

      plan,
    })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó la modificación múltiple porque excede el alcance autorizado.",

      policy,
      plan,

      warnings:
        policy.violations,
    }
  }

  /*
   * PREVIEW
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        `Cambio múltiple preparado: ${plan.changedNodes} nodos modificados.`,

      policy,
      plan,

      warnings:
        plan.warnings,
    }
  }

  /*
   * EXECUTE
   */
  const applied =
    await applyMutation({
      plan,

      pageSlug,
    })

  if (!applied.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "La modificación múltiple se escribió pero no pudo verificarse.",

      policy,
      plan,

      warnings: [
        "Falló la verificación posterior a la escritura.",
      ],
    }
  }

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      `Cambio múltiple aplicado y verificado correctamente: ${plan.changedNodes} nodos modificados.`,

    policy,
    plan,

    snapshot:
      plan.snapshot,

    warnings:
      plan.warnings,
  }
}

/*
 * SECTION EDIT
 *
 * Las modificaciones estructurales de sección
 * usan Section Mutation Planner y no pasan
 * por Autonomous Site Builder completo.
 */
if (scope === "section_edit") {
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      input.pageSlug ?? "home",
    )

  const parsedSectionIntent =
  parseSectionIntent(
    input.message,
  )

  const useAutonomousComposer =
    parsedSectionIntent.operation === "add" &&
    !resolvedTargetSectionId &&
    shouldUseAutonomousSectionComposer(
      input.message,
    )

  let section =
    useAutonomousComposer
      ? buildAutonomousSectionMutation({
          before,
          request: input.message,
        }) ??
        planSectionMutation({
          tree: before,
          request: input.message,
          targetSectionId:
            resolvedTargetSectionId,
        })
      : planSectionMutation({
          tree: before,
          request: input.message,
          targetSectionId:
            resolvedTargetSectionId,
        })

  if (
    !section.ok &&
    parsedSectionIntent.operation === "add" &&
    !resolvedTargetSectionId
  ) {
    section =
      buildAutonomousSectionMutation({
        before,
        request: input.message,
      }) ?? section
  }

  if (!section.ok) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        section.warnings[0] ??
        "No pude preparar una modificación segura de sección.",

      warnings:
        section.warnings,
    }
  }

if (
  mode === "execute" &&
  (
    parsedSectionIntent.operation === "remove" ||
    parsedSectionIntent.operation === "replace"
  )
) {
  if (!parsedSectionIntent.role) {
    return {
      ok: false,
      action: "blocked",
      scope,
      message:
        "No pude identificar con seguridad la sección que debe modificarse.",
      warnings: [
        "La operación destructiva no tiene un rol de sección identificable.",
      ],
    }
  }

  const discovery =
    discoverRootSection(
      before,
      parsedSectionIntent.role,
    )

  if (
    !canExecuteDestructiveSectionOperation(
      discovery,
    )
  ) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        `La sección "${parsedSectionIntent.role}" no tiene suficiente confianza para una operación destructiva.`,

      warnings: [
        `Confianza detectada: ${discovery.confidence}.`,
      ],
    }
  }
}

  const plan =
    createDryRunMutationPlan({
      siteId:
        input.siteId,

      before,

      after:
        section.tree,
    })

  const policy =
  evaluateMutationPolicy({
    request:
      input.message,

    scopeOverride:
      scope,

    plan,

    targetSectionId:
      section.rootSectionId ??
      resolvedTargetSectionId,
  })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó la modificación de sección porque excede el alcance autorizado.",

      policy,
      plan,

      warnings:
        policy.violations,
    }
  }

  /*
   * Primero preview.
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        section.warnings.length > 0
          ? `Sección editable preparada: ${plan.addedNodes} nodos agregados con inspiración artesanal.`
          : `Sección preparada: ${plan.addedNodes} nodos agregados, ${plan.removedNodes} eliminados y ${plan.changedNodes} modificados.`,

      policy,
      plan,

      warnings: [
        ...section.warnings,
        ...plan.warnings,
      ],
    }
  }

  /*
   * Ejecución.
   */
  const applied =
    await applyMutation({
      plan,

      pageSlug:
        input.pageSlug ?? "home",
    })

  if (!applied.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "La modificación de sección se escribió pero no pudo verificarse.",

      policy,
      plan,

      warnings: [
        "Falló la verificación posterior a la escritura.",
      ],
    }
  }

  if (
  parsedSectionIntent.operation !==
    "remove" &&
  section.rootSectionId
) {
  const target = {
    kind: "section" as const,

    sectionId:
      section.rootSectionId,

    role:
      section.role,

    pageSlug,

    confidence:
      "high" as const,
  }

  rememberConversationTurn({
    siteId:
      input.siteId,

    pageSlug,

    turn: {
      message:
        input.message,

      scope,

      target,

      action:
        "executed",

      createdAt:
        new Date().toISOString(),
    },

    successfulTarget:
      target,
  })
} else {
  rememberConversationTurn({
    siteId:
      input.siteId,

    pageSlug,

    turn: {
      message:
        input.message,

      scope,

      action:
        "executed",

      createdAt:
        new Date().toISOString(),
    },
  })
}

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      section.warnings.length > 0
        ? `La sección editable "${section.role ?? "solicitada"}" fue creada y verificada correctamente.`
        : `La sección "${section.role ?? "solicitada"}" fue aplicada y verificada correctamente.`,

    policy,
    plan,

    snapshot:
      plan.snapshot,

    warnings: [
      ...section.warnings,
      ...plan.warnings,
    ],
  }
}

  const business =
    input.business ?? {}

  /*
   * Por ahora las solicitudes de escritura
   * producen un dry-run completo.
   *
   * Mutation Policy impedirá que una orden local
   * use accidentalmente una mutación destructiva.
   */
  const plan =
    await createRealSiteDryRun({
      siteId: input.siteId,

      pageSlug:
        input.pageSlug ?? "home",

      request:
        input.message,

      business: {
        name:
          business.name ??
          "Tu negocio",

        industry:
          business.industry ??
          "negocio",

        location:
          business.location,

        description:
          business.description,

        objective:
          business.objective,

        services:
          business.services,
      },
    })

  const policy =
  evaluateMutationPolicy({
    request:
      input.message,

    scopeOverride:
      scope,

    plan,

    targetNodeId:
      resolvedTargetNodeId,

    targetSectionId:
      resolvedTargetSectionId,
  })

  if (!policy.allowed) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "Orvenix AI bloqueó la operación porque el plan excede el alcance autorizado.",

      policy,
      plan,
      warnings:
        policy.violations,
    }
  }

  /*
   * Una operación que requiere confirmación
   * nunca se ejecuta sin confirmed=true.
   */
   if (
    mode === "execute" &&
    policy.limits.requireConfirmation &&
    !input.confirmed
  ) {
    return {
      ok: true,

      action:
        "confirmation_required",

      scope,

      message:
        `La operación está lista. Se agregarán ${plan.addedNodes}, se eliminarán ${plan.removedNodes} y se modificarán ${plan.changedNodes} nodos.`,

          policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        plan.warnings,
    }
  }

  /*
   * PREVIEW
   */
  if (mode === "preview") {
    return {
      ok: true,
      action: "preview",
      scope,

      message:
        "La mutación fue validada y está lista para ejecutarse.",

            policy,
      plan,

      snapshot:
        plan.snapshot,

      warnings:
        plan.warnings,
    }
  }

  /*
   * EXECUTE
   */
  const result =
    await applyMutation({
      plan,

      pageSlug:
        input.pageSlug ?? "home",
    })

  if (!result.verified) {
    return {
      ok: false,
      action: "blocked",
      scope,

      message:
        "La escritura no pudo verificarse.",

      policy,
      plan,

      warnings: [
        "La mutación no superó la verificación posterior.",
      ],
    }
  }

  return {
    ok: true,
    action: "executed",
    scope,

    message:
      "Orvenix AI aplicó y verificó correctamente los cambios.",

    policy,
      plan,
      warnings:
        plan.warnings,
  }
}
