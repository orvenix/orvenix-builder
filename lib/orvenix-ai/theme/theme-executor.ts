import {
  getResolvedSiteTheme,
  saveResolvedSiteTheme,
} from "@/lib/builder-core/tree/sitePages"

import type {
  GlobalTheme,
} from "@/types/editor"

export interface ThemeSnapshot {
  siteId: string
  theme: GlobalTheme
  source: string
  createdAt: string
}

export interface ThemeExecutionResult {
  verified: boolean
  theme: GlobalTheme
  source: string
}

function sameTheme(
  a: GlobalTheme,
  b: GlobalTheme,
) {
  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  )
}

export async function createThemeSnapshot(
  siteId: string,
): Promise<ThemeSnapshot> {
  const resolved =
    await getResolvedSiteTheme(
      siteId,
    )

  return {
    siteId,

    theme:
      structuredClone(
        resolved.tokens,
      ),

    source:
      resolved.source,

    createdAt:
      new Date().toISOString(),
  }
}

export async function applyThemeMutation(
  params: {
    siteId: string
    theme: GlobalTheme
  },
): Promise<ThemeExecutionResult> {
  await saveResolvedSiteTheme(
    params.siteId,
    params.theme,
  )

  /*
   * Verificación real después
   * de persistir.
   */
  const resolved =
    await getResolvedSiteTheme(
      params.siteId,
    )

  return {
    verified:
      sameTheme(
        resolved.tokens,
        params.theme,
      ),

    theme:
      structuredClone(
        resolved.tokens,
      ),

    source:
      resolved.source,
  }
}

export async function rollbackThemeMutation(
  snapshot: ThemeSnapshot,
): Promise<ThemeExecutionResult> {
  await saveResolvedSiteTheme(
    snapshot.siteId,
    snapshot.theme,
  )

  /*
   * Volvemos a leer después del rollback.
   * No confiamos solamente en que el write
   * haya terminado sin lanzar error.
   */
  const resolved =
    await getResolvedSiteTheme(
      snapshot.siteId,
    )

  return {
    verified:
      sameTheme(
        resolved.tokens,
        snapshot.theme,
      ),

    theme:
      structuredClone(
        resolved.tokens,
      ),

    source:
      resolved.source,
  }
}