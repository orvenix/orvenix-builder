import type { EditorTree } from "@/types/editor"
import { getExperienceCapabilities } from "@/components/editor/experience/experience-config"
import type { EditorExperienceCapabilities, EditorExperienceMode } from "@/components/editor/experience/types"

/**
 * CV1-2: the editor's mode contract.
 *
 *   simple -> the customer experience (business edits only)
 *   pro    -> the existing Studio experience (every current capability)
 *
 * Both profiles edit the SAME EditorTree through the SAME store and the SAME
 * renderer; a profile only selects which capabilities the UI exposes. The
 * capability table itself stays in experience-config.ts (single source), so
 * no component branches on "simple" directly.
 *
 * Hard constraints (auth, tenant isolation, sanitized HTML, safe URLs,
 * authoritative commerce/bindings) are enforced server-side and in the
 * renderer, never through a profile.
 */
export type EditorModeProfile = "simple" | "pro"

export const EDITOR_MODE_PROFILES: readonly EditorModeProfile[] = ["simple", "pro"]

const PROFILE_EXPERIENCE: Record<EditorModeProfile, EditorExperienceMode> = {
  simple: "client",
  pro: "studio",
}

export function editorExperienceForProfile(profile: EditorModeProfile): EditorExperienceMode {
  return PROFILE_EXPERIENCE[profile]
}

export function editorProfileForExperience(mode: EditorExperienceMode): EditorModeProfile {
  return mode === "studio" ? "pro" : "simple"
}

export function getEditorModeCapabilities(profile: EditorModeProfile): EditorExperienceCapabilities {
  return getExperienceCapabilities(editorExperienceForProfile(profile))
}

export function isEditorModeProfile(value: unknown): value is EditorModeProfile {
  return value === "simple" || value === "pro"
}

/**
 * A site created from an Orvenix commercial design (CV1-1b demo-shape):
 * every compiled page root carries this marker, persisted in SitePage.tree.
 * Mirrors COMMERCIAL_FIDELITY_ROOT_PROP_V1 (commercial-designs/empty-states)
 * without importing the compiler into the editor bundle; a test pins both.
 */
export const COMMERCIAL_DESIGN_ROOT_MARKER = { prop: "commercialDesignFidelity", value: "demo-shape" } as const

export function isCommercialDesignTree(tree: Pick<EditorTree, "rootId" | "nodes"> | null | undefined): boolean {
  const root = tree?.nodes?.[tree.rootId]
  return root?.props?.[COMMERCIAL_DESIGN_ROOT_MARKER.prop] === COMMERCIAL_DESIGN_ROOT_MARKER.value
}

/**
 * Initial profile when the editor opens:
 *  1. the person's own saved choice for this site (UI preference only),
 *  2. a site from an Orvenix design opens in Simple -- for everyone,
 *  3. otherwise the pre-CV1-2 behavior: admins in Pro, customers in Simple.
 */
export function resolveInitialEditorModeProfile(params: {
  tree: Pick<EditorTree, "rootId" | "nodes"> | null | undefined
  userRole: "admin" | "client"
  storedPreference?: unknown
}): EditorModeProfile {
  if (isEditorModeProfile(params.storedPreference)) return params.storedPreference
  if (isCommercialDesignTree(params.tree)) return "simple"
  return params.userRole === "admin" ? "pro" : "simple"
}

/** Per-site, per-browser UI preference (never site data, never persisted server-side). */
export function editorModeStorageKey(websiteId: string): string {
  return `orvenix:editor-mode:${websiteId}`
}
