import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"

import {
  buildDesignReferenceId,
  type AccentTendency,
  type AlignmentTendency,
  type BackgroundRhythm,
  type CardStrategy,
  type ContactPattern,
  type ContainerStrategy,
  type ContrastTendency,
  type CtaArrangement,
  type DensityTendency,
  type DesignPersonality,
  type DesignReference,
  type DesignReferenceExtractionMetadata,
  type DistinctiveTrait,
  type ExtractionSignal,
  type HeroBackgroundTreatment,
  type HeroMediaStrategy,
  type PagePurpose,
  type RadiusTendency,
  type SectionRole,
  type SectionTreatment,
  type ShadowTendency,
  type ThemeMode,
  type TypographyScale,
  type VisualFamily,
} from "./contract"
import { PAGE_PURPOSE_BY_FOLDER, SECTION_ROLE_KEYWORDS, WEBS_BUSINESS_AFFINITY } from "./vocabulary-mappings"
import { assertSanitizedDesignReference } from "./sanitize"

/**
 * V2-5A.2 deterministic extractor.
 *
 * Reads app/webs source TEXT with regex/string heuristics (no AST
 * parser dependency, no LLM, no network, no rendering, no DB). Same
 * input files always produce the same DesignReference. Prefers
 * "unknown" bounded-vocabulary values over guessing when a signal is
 * genuinely ambiguous.
 */

const NON_CANDIDATE_SUBDIRS = new Set(["data", "_site", "_shared"])

function findRepoRoot(startDir: string): string {
  let dir = startDir
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir)
    if (parent === dir) return startDir
    dir = parent
  }
  return dir
}

export function defaultWebsRoot(): string {
  return join(findRepoRoot(__dirname), "app", "webs")
}

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : ""
}

function isDeadRedirectStub(dirPath: string): boolean {
  const content = readIfExists(join(dirPath, "page.tsx"))
  if (!content) return false
  const trimmed = content.trim()
  return trimmed.length < 200 && /redirect\(\s*["']\/webs["']\s*\)/.test(trimmed)
}

function listPageFolders(dirPath: string): string[] {
  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_CANDIDATE_SUBDIRS.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort()
}

export interface WebsCandidate {
  slug: string
  dirPath: string
}

export function discoverWebsCandidates(websRoot: string = defaultWebsRoot()): WebsCandidate[] {
  if (!existsSync(websRoot)) return []

  return readdirSync(websRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared" && !entry.name.startsWith("."))
    .map((entry) => ({ slug: entry.name, dirPath: join(websRoot, entry.name) }))
    .filter((candidate) => !isDeadRedirectStub(candidate.dirPath))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(new RegExp(pattern, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"))
  return matches ? matches.length : 0
}

function extractHeroRegion(text: string): string {
  const firstSection = text.indexOf("<section")
  if (firstSection === -1) return text.slice(0, 3000)
  const secondSection = text.indexOf("<section", firstSection + 8)
  return secondSection === -1 ? text.slice(firstSection, firstSection + 3000) : text.slice(firstSection, secondSection)
}

function detectThemeMode(text: string, signals: Set<ExtractionSignal>): ThemeMode {
  const dark = /bg-\[#0[0-9a-fA-F]{2,6}\]/.test(text) || /\bbg-black\b/.test(text) || /\b(?:bg|from|via|to)-dark\b/.test(text)
  const light = /bg-\[#f[0-9a-fA-F]{2,6}\]/i.test(text) || /\bbg-white\b(?!\/)/.test(text) || /\bbg-gray-50\b/.test(text)
  if (dark) signals.add("dark-bg-literal")
  if (light) signals.add("light-bg-literal")
  if (dark && light) return "mixed"
  if (dark) return "dark"
  if (light) return "light"
  return "unknown"
}

function detectHeroBackgroundAndMedia(
  heroRegion: string,
  signals: Set<ExtractionSignal>,
): { backgroundTreatment: HeroBackgroundTreatment; mediaStrategy: HeroMediaStrategy } {
  const hasPhoto = /next\/image|<Image\b|bg-\[url\(|unsplash/i.test(heroRegion)
  if (hasPhoto) {
    signals.add("next-image-or-photo-url")
    return { backgroundTreatment: "full-bleed-photo", mediaStrategy: "photography" }
  }
  const hasGlow = /blur-\[\d+px\]/.test(heroRegion)
  if (hasGlow) {
    signals.add("abstract-glow-orbs")
    return { backgroundTreatment: "abstract-glow", mediaStrategy: "none" }
  }
  const hasCustomGradient = /bg-hero-glow|bg-gradient-to-[a-z]+/.test(heroRegion)
  if (hasCustomGradient) {
    signals.add("custom-hero-gradient-class")
    return { backgroundTreatment: "solid-gradient", mediaStrategy: "none" }
  }
  return { backgroundTreatment: "unknown", mediaStrategy: "unknown" }
}

function detectHeroAlignment(heroRegion: string): AlignmentTendency {
  const hasCenter = /text-center/.test(heroRegion)
  const hasLeftColumn = /max-w-(xl|2xl|3xl|4xl)\b/.test(heroRegion)
  if (hasCenter && hasLeftColumn) return "mixed"
  if (hasCenter) return "center"
  if (hasLeftColumn) return "left"
  return "unknown"
}

function detectCtaArrangement(heroRegion: string): CtaArrangement {
  const count = countMatches(heroRegion, /<Link\b|<a\s/g)
  if (count >= 2) return "dual-cta"
  if (count === 1) return "single-cta"
  return "unknown"
}

function detectTypographyScale(text: string): TypographyScale {
  if (/text-8xl|text-7xl/.test(text)) return "large-display"
  if (/text-6xl|text-5xl/.test(text)) return "moderate"
  return "unknown"
}

function detectTypographyAlignment(text: string): AlignmentTendency {
  const centerCount = countMatches(text, /text-center/g)
  if (centerCount >= 3) return "center"
  if (centerCount >= 1) return "mixed"
  return "left"
}

function detectRadiusTendency(text: string): RadiusTendency {
  const pill = countMatches(text, /rounded-full/g)
  const soft = countMatches(text, /rounded-(xl|2xl|3xl)\b/g)
  const sharp = countMatches(text, /rounded-(none|sm|md)\b/g)
  const max = Math.max(pill, soft, sharp)
  if (max === 0) return "unknown"
  const winners = [pill === max, soft === max, sharp === max].filter(Boolean).length
  if (winners > 1) return "unknown"
  if (pill === max) return "pill"
  if (soft === max) return "soft"
  return "sharp"
}

function detectShadowTendency(text: string, signals: Set<ExtractionSignal>): ShadowTendency {
  const strong = countMatches(text, /shadow-(xl|2xl)\b/g)
  const soft = countMatches(text, /shadow-(sm|md)\b/g)
  if (strong === 0 && soft === 0) return "none"
  if (strong > soft) {
    signals.add("strong-shadow-classes")
    return "strong"
  }
  if (soft > strong) return "soft"
  return "unknown"
}

function detectContrastTendency(text: string, signals: Set<ExtractionSignal>): ContrastTendency {
  const fadedCount = countMatches(text, /text-(white|black)\/\d{1,3}\b/g)
  if (fadedCount >= 5) {
    signals.add("opacity-faded-text")
    return "low"
  }
  if (fadedCount >= 1) return "medium"
  return "unknown"
}

function detectAccentTendency(text: string): AccentTendency {
  const warm = countMatches(text, /\b(amber|orange|red|yellow|rose)-\d{3}\b/g)
  const cool = countMatches(text, /\b(teal|cyan|blue|indigo|sky|emerald|violet|purple)-\d{3}\b/g)
  const neutral = countMatches(text, /\b(slate|gray|zinc|stone|neutral)-\d{3}\b/g)
  const total = warm + cool + neutral
  if (total === 0) return "unknown"
  if (warm > cool && warm > neutral) return "warm"
  if (cool > warm && cool > neutral) return "cool"
  if (neutral > warm && neutral > cool) return "neutral"
  return "unknown"
}

function detectContainerStrategy(text: string): ContainerStrategy {
  return /max-w-(6xl|7xl)\s+mx-auto/.test(text) ? "centered-max-width" : "unknown"
}

function detectCardStrategy(text: string): CardStrategy {
  const elevated = countMatches(text, /shadow-(xl|2xl)\b/g)
  const bordered = countMatches(text, /\bborder\b/g)
  if (elevated > 3 && elevated >= bordered) return "elevated"
  if (bordered > 3) return "bordered"
  if (/rounded-(2xl|3xl)\b/.test(text)) return "flat"
  return "unknown"
}

function detectDensity(text: string): DensityTendency {
  const spacious = countMatches(text, /\bpy-(2[0-9]|3[0-9])\b/g)
  const standard = countMatches(text, /\bpy-1[0-6]\b/g)
  const compact = countMatches(text, /\bpy-[4-9]\b/g)
  const max = Math.max(spacious, standard, compact)
  if (max === 0) return "unknown"
  if (spacious === max) return "spacious"
  if (standard === max) return "standard"
  return "compact"
}

function detectBackgroundRhythm(text: string): BackgroundRhythm {
  const sectionTags = text.match(/<section\b[^>]*>/g) ?? []
  if (sectionTags.length < 2) return "unknown"
  const withOwnBg = sectionTags.filter((tag) => /\bbg-/.test(tag)).length
  return withOwnBg / sectionTags.length > 0.4 ? "alternating" : "uniform"
}

/**
 * One marker per ACTUAL top-level content-block tag in the home page
 * (<section> or the semantic <footer> element some references use
 * instead of a <section id="footer">) -- never a bare scan of every
 * id="..."/comment in the whole file. A label is attributed to a block
 * only if it is that block's OWN id attribute, the tag itself being
 * <footer> (self-evident, no lookup needed), or the nearest
 * {/* ... *\/} comment strictly between the end of the PREVIOUS block
 * tag and the start of this one. This is what stops a comment
 * describing a small sub-element NESTED inside one section's body
 * (e.g. a "social proof" strip inside the hero) from being mistaken
 * for its own separate section -- it never gets a block tag of its
 * own, so it is simply never visited. A block with no resolvable label
 * contributes no marker (dropped, same as an unclassifiable one)
 * rather than a guess.
 */
function collectOrderedSectionMarkers(homeText: string, signals: Set<ExtractionSignal>): string[] {
  const blockTags: Array<{ start: number; end: number; ownId: string | null; isFooterTag: boolean }> = []
  for (const match of homeText.matchAll(/<(section|footer)\b[^>]*>/g)) {
    const start = match.index ?? 0
    const idMatch = match[0].match(/\bid=["']([a-zA-Z0-9_-]+)["']/)
    blockTags.push({ start, end: start + match[0].length, ownId: idMatch ? idMatch[1] : null, isFooterTag: match[1] === "footer" })
  }

  const comments: Array<{ start: number; end: number; label: string }> = []
  for (const match of homeText.matchAll(/\{\/\*\s*([^*]+?)\s*\*\/\}/g)) {
    const start = match.index ?? 0
    comments.push({ start, end: start + match[0].length, label: match[1] })
  }

  let sawId = false
  let sawComment = false
  const markers: string[] = []

  blockTags.forEach((tag, index) => {
    if (tag.isFooterTag) {
      markers.push("footer")
      return
    }
    if (tag.ownId) {
      markers.push(tag.ownId)
      sawId = true
      return
    }
    const windowStart = index === 0 ? 0 : blockTags[index - 1].end
    let nearestLabel: string | null = null
    for (const comment of comments) {
      if (comment.start >= windowStart && comment.end <= tag.start) nearestLabel = comment.label
    }
    if (nearestLabel !== null) {
      markers.push(nearestLabel)
      sawComment = true
    }
  })

  if (sawId) signals.add("section-id-anchors")
  if (sawComment) signals.add("section-comment-markers")
  return markers
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function classifySectionSignal(raw: string): SectionRole {
  const normalized = normalizeForMatch(raw)
  for (const { role, keywords } of SECTION_ROLE_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)))) return role
  }
  return "unknown"
}

function detectRoleSequence(
  homeText: string,
  layoutText: string,
  sharedNavPresent: boolean,
  signals: Set<ExtractionSignal>,
): SectionRole[] {
  // Order is only meaningful within ONE file: the home page's own
  // content. layout.tsx wraps every page with persistent nav/footer
  // chrome outside that content, so it's consulted only as a fallback
  // signal for navigation/footer presence, never mixed into the
  // ordered scan itself.
  const rawMarkers = collectOrderedSectionMarkers(homeText, signals)
  const classified = rawMarkers.map(classifySectionSignal).filter((role) => role !== "unknown")
  const layoutHasFooterSignal = /\bid=["']footer["']|\{\/\*\s*footer|<footer\b/i.test(layoutText)

  // navigation/footer are deliberately NOT read from their position in
  // `classified`: they are structural rails inferred from shared-nav
  // import evidence / layout.tsx wrapping every page, always first and
  // always last respectively, exactly like Orvenix's own composer
  // invariant (navigation first, footer last). Everything else keeps
  // its real, unde-duplicated home-page order -- two genuinely distinct
  // sections that happen to share a role (e.g. two "content" sections)
  // are both preserved.
  const sequence: SectionRole[] = []
  if (sharedNavPresent || classified.includes("navigation")) sequence.push("navigation")
  for (const role of classified) {
    if (role === "navigation" || role === "footer") continue
    sequence.push(role)
  }
  if (classified.includes("footer") || layoutHasFooterSignal) sequence.push("footer")

  return sequence
}

function detectDistinctiveTraits(
  text: string,
  pageFolders: string[],
): DistinctiveTrait[] {
  const traits = new Set<DistinctiveTrait>()

  if (pageFolders.includes("carrito")) traits.add("cart-flow")
  if (["catalogo", "producto", "propiedades", "destinos", "paquetes", "habitaciones"].some((f) => pageFolders.includes(f))) {
    traits.add("catalog-browsing")
  }
  if (/\bStar\b/.test(text) && /rating/i.test(text) && ["medicos", "entrenadores", "agentes"].some((f) => pageFolders.includes(f))) {
    traits.add("rated-person-card")
  }
  if (/popular\s*:\s*(true|false)/i.test(text)) traits.add("pricing-tier-highlight")
  if (countMatches(text, /"0[1-4]"/g) >= 2) traits.add("numbered-process")
  if (/\bstats?\w*\.map\(/i.test(text)) traits.add("credibility-stat-row")
  if (/animate-pulse/.test(text) && /(abierto|disponible)/i.test(text)) traits.add("live-status-indicator")
  if (/useState\(["'][^"']+["']\)/.test(text) && /\.find\(\(?\w*\)?\s*=>/.test(text)) traits.add("tabbed-content-switcher")
  if (/insurance|aseguradora/i.test(text)) traits.add("logo-strip")

  return Array.from(traits)
}

function detectContactPattern(text: string, pageFolders: string[]): ContactPattern {
  if (/\b(fecha|hora|personas|especialidad|membresia)\b/i.test(text) && /useState/.test(text)) return "booking-form"
  if (/\b(nombre|email|telefono)\b/i.test(text) && /useState/.test(text)) return "generic-form"
  if (["carrito", "catalogo", "pedidos"].some((f) => pageFolders.includes(f))) return "catalog-cta"
  return "unknown"
}

function deriveRecurringTreatments(
  roleSequence: SectionRole[],
  traits: DistinctiveTrait[],
): SectionTreatment[] {
  const treatments = new Set<SectionTreatment>()
  if (roleSequence.includes("faq")) treatments.add("accordion")
  if (roleSequence.includes("process") && traits.includes("numbered-process")) treatments.add("numbered-process")
  if (roleSequence.includes("trust") && traits.includes("logo-strip")) treatments.add("logo-strip")
  if (roleSequence.includes("pricing")) treatments.add("pricing-tiers")
  if (traits.includes("rated-person-card")) treatments.add("rated-card-grid")
  if (traits.includes("tabbed-content-switcher")) treatments.add("tabbed-switcher")
  if (traits.includes("credibility-stat-row")) treatments.add("credibility-stat-row")

  const genericGridRoles: SectionRole[] = ["services", "features", "products", "content"]
  if (genericGridRoles.some((role) => roleSequence.includes(role)) && treatments.size === 0) {
    treatments.add("standard-grid")
  }

  return Array.from(treatments)
}

function deriveVisualFamily(
  mediaStrategy: HeroMediaStrategy,
  backgroundTreatment: HeroBackgroundTreatment,
  themeMode: ThemeMode,
  isSaas: boolean,
): VisualFamily {
  if (isSaas) return "saas-conversion"
  if (mediaStrategy === "photography") return "full-bleed-photography"
  if (backgroundTreatment === "abstract-glow" && themeMode === "dark") return "ambient-dark-abstract"
  return "unknown"
}

function deriveDesignPersonality(themeMode: ThemeMode, mediaStrategy: HeroMediaStrategy): DesignPersonality {
  if (themeMode === "dark" && mediaStrategy === "none") return "bold-confident"
  if (themeMode === "dark" && mediaStrategy === "photography") return "editorial-premium"
  if ((themeMode === "light" || themeMode === "mixed") && mediaStrategy === "photography") return "warm-approachable"
  return "unknown"
}

function pageCountBucketOf(pageCount: number): DesignReference["pageGrammar"]["pageCountBucket"] {
  if (pageCount <= 1) return "single-page"
  if (pageCount <= 3) return "few-pages"
  if (pageCount <= 5) return "standard-pages"
  return "many-pages"
}

function deriveConfidence(signals: Set<ExtractionSignal>): DesignReferenceExtractionMetadata["confidence"] {
  if (signals.size >= 6) return "high"
  if (signals.size >= 3) return "medium"
  return "low"
}

export function extractDesignReference(candidate: WebsCandidate, repoRoot: string = findRepoRoot(__dirname)): DesignReference {
  const { slug, dirPath } = candidate
  const homeText = readIfExists(join(dirPath, "page.tsx"))
  const layoutText = readIfExists(join(dirPath, "layout.tsx"))
  const fullText = `${homeText}\n${layoutText}`

  const pageFolders = listPageFolders(dirPath)
  const pageCount = 1 + pageFolders.length
  const multiPage = pageFolders.length > 0

  const signals = new Set<ExtractionSignal>()
  const sharedNavPresent = /_shared\/components\/EnhancedSiteNav/.test(fullText)
  if (sharedNavPresent) signals.add("shared-nav-import")

  const heroRegion = extractHeroRegion(fullText)
  const themeMode = detectThemeMode(fullText, signals)
  const { backgroundTreatment, mediaStrategy } = detectHeroBackgroundAndMedia(heroRegion, signals)
  const alignment = detectHeroAlignment(heroRegion)
  const ctaArrangement = detectCtaArrangement(heroRegion)

  const roleSequence = detectRoleSequence(homeText, layoutText, sharedNavPresent, signals)
  const traits = detectDistinctiveTraits(fullText, pageFolders)
  if (traits.includes("cart-flow")) signals.add("cart-route-present")
  if (traits.includes("catalog-browsing")) signals.add("catalog-route-present")
  if (traits.includes("pricing-tier-highlight")) signals.add("pricing-popular-flag")
  if (traits.includes("numbered-process")) signals.add("numbered-steps-array")
  if (traits.includes("rated-person-card")) signals.add("rating-and-star-icon")
  if (traits.includes("live-status-indicator")) signals.add("animate-pulse-with-status-copy")

  const recurringTreatments = deriveRecurringTreatments(roleSequence, traits)

  if (/bg-clip-text/.test(fullText)) signals.add("gradient-text-heading")
  const cardStrategy = detectCardStrategy(fullText)
  if (cardStrategy === "bordered") signals.add("bordered-card-classes")

  const businessAffinity = WEBS_BUSINESS_AFFINITY[slug] ?? "other"
  const isSaas = businessAffinity === "saas"
  const visualFamily = deriveVisualFamily(mediaStrategy, backgroundTreatment, themeMode, isSaas)
  const designPersonality = deriveDesignPersonality(themeMode, mediaStrategy)

  const density = detectDensity(fullText)

  const pagePurposes: PagePurpose[] = Array.from(
    new Set<PagePurpose>(["home", ...pageFolders.map((folder) => PAGE_PURPOSE_BY_FOLDER[folder] ?? "unknown")]),
  )

  const reference: DesignReference = {
    id: buildDesignReferenceId(slug),
    version: 1,
    identity: {
      source: "webs",
      sourcePath: relative(repoRoot, dirPath).split("\\").join("/"),
      businessAffinity,
      visualFamily,
      designPersonality,
    },
    pageGrammar: {
      multiPage,
      pageCount,
      pageCountBucket: pageCountBucketOf(pageCount),
      pagePurposes,
    },
    heroGrammar: {
      backgroundTreatment,
      alignment,
      mediaStrategy,
      ctaArrangement,
      supportingSignals: traits.filter((t) => t === "credibility-stat-row" || t === "live-status-indicator"),
    },
    sectionGrammar: {
      roleSequence,
      recurringTreatments,
      density,
    },
    themeGrammar: {
      mode: themeMode,
      accent: detectAccentTendency(fullText),
      radius: detectRadiusTendency(fullText),
      shadow: detectShadowTendency(fullText, signals),
      contrast: detectContrastTendency(fullText, signals),
    },
    typographyGrammar: {
      scale: detectTypographyScale(fullText),
      alignment: detectTypographyAlignment(fullText),
    },
    assetGrammar: {
      strategy: mediaStrategy === "photography" ? "photography" : mediaStrategy === "none" ? "abstract" : "mixed",
      placement: mediaStrategy === "photography" ? "hero-full-bleed" : mediaStrategy === "none" ? "none" : "unknown",
    },
    compositionGrammar: {
      container: detectContainerStrategy(fullText),
      card: cardStrategy,
      density,
      backgroundRhythm: detectBackgroundRhythm(fullText),
    },
    conversionGrammar: {
      ctaStrategy: roleSequence.includes("pricing")
        ? "pricing-driven"
        : ctaArrangement === "dual-cta"
          ? "dual-action"
          : ctaArrangement === "single-cta"
            ? "single-action"
            : "unknown",
      contactPattern: detectContactPattern(fullText, pageFolders),
    },
    distinctiveTraits: traits,
    extraction: {
      extractorVersion: 1,
      confidence: deriveConfidence(signals),
      signals: Array.from(signals),
    },
  }

  assertSanitizedDesignReference(reference)
  return reference
}

export function discoverDesignReferences(websRoot: string = defaultWebsRoot()): DesignReference[] {
  const repoRoot = findRepoRoot(__dirname)
  return discoverWebsCandidates(websRoot)
    .map((candidate) => extractDesignReference(candidate, repoRoot))
    .sort((a, b) => a.id.localeCompare(b.id))
}
