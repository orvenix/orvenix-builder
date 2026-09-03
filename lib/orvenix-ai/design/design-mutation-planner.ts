import type {
  EditorTree,
  GlobalTheme,
} from "@/types/editor"

import {
  applyParsedMultiMutation,
} from "@/lib/orvenix-ai/multi"

import {
  applyParsedThemeMutation,
} from "@/lib/orvenix-ai/theme"

import {
  getDesignRecipe,
} from "./design-recipes"

import {
  parseDesignIntent,
} from "./design-intent"

import type {
  OrvenixDesignIntent,
} from "./types"

export interface DesignMutationResult {
  ok: boolean

  intent:
    OrvenixDesignIntent

  beforeTree:
    EditorTree

  afterTree:
    EditorTree

  beforeTheme:
    GlobalTheme

  afterTheme:
    GlobalTheme

  changedThemeTokens:
    string[]

  multiChanges:
    number

  warnings:
    string[]
}

export function planDesignMutation(
  params: {
    tree: EditorTree
    theme: GlobalTheme
    request: string
  },
): DesignMutationResult {
  const parsed =
    parseDesignIntent(
      params.request,
    )

  const beforeTree =
    structuredClone(
      params.tree,
    )

  const beforeTheme =
    structuredClone(
      params.theme,
    )

  if (
    parsed.intent ===
    "unknown"
  ) {
    return {
      ok: false,

      intent:
        parsed.intent,

      beforeTree,

      afterTree:
        structuredClone(
          beforeTree,
        ),

      beforeTheme,

      afterTheme:
        structuredClone(
          beforeTheme,
        ),

      changedThemeTokens: [],

      multiChanges: 0,

      warnings: [
        "No se pudo identificar una intención global de diseño.",
      ],
    }
  }

  const recipe =
    getDesignRecipe(
      parsed.intent,
    )

  if (!recipe) {
    return {
      ok: false,

      intent:
        parsed.intent,

      beforeTree,

      afterTree:
        structuredClone(
          beforeTree,
        ),

      beforeTheme,

      afterTheme:
        structuredClone(
          beforeTheme,
        ),

      changedThemeTokens: [],

      multiChanges: 0,

      warnings: [
        "No existe una receta de diseño para la intención detectada.",
      ],
    }
  }

  let currentTheme =
    structuredClone(
      beforeTheme,
    )

  const changedThemeTokens =
    new Set<string>()

  const warnings:
    string[] =
      []

  /*
   * THEME MUTATIONS
   *
   * Se acumulan sobre el mismo Theme.
   * Un no-op no invalida toda la receta.
   */
  for (
    const mutation of
      recipe.theme
  ) {
    const result =
      applyParsedThemeMutation({
        theme:
          currentTheme,

        parsed:
          mutation,
      })

    if (!result.ok) {
      warnings.push(
        ...result.warnings,
      )

      continue
    }

    currentTheme =
      result.afterTheme

    for (
      const token of
        result.changedTokens
    ) {
      changedThemeTokens.add(
        token,
      )
    }
  }

  /*
   * MULTI MUTATIONS
   *
   * Cada operación recibe el árbol
   * producido por la operación anterior.
   */
  let currentTree =
    structuredClone(
      beforeTree,
    )

  let multiChanges =
    0

  for (
    const mutation of
      recipe.multi
  ) {
    const result =
      applyParsedMultiMutation({
        tree:
          currentTree,

        parsed:
          mutation,
      })

    if (!result.ok) {
      warnings.push(
        ...result.warnings,
      )

      continue
    }

    currentTree =
      result.tree

    multiChanges +=
      result.changes.length
  }

  /*
   * Mantener Theme y GlobalTheme
   * sincronizados en el árbol final.
   */
  currentTree.theme =
    structuredClone(
      currentTheme,
    )

  currentTree.globalTheme =
    structuredClone(
      currentTheme,
    )

  const themeChanged =
    JSON.stringify(
      beforeTheme,
    ) !==
    JSON.stringify(
      currentTheme,
    )

  const treeChanged =
    JSON.stringify(
      beforeTree,
    ) !==
    JSON.stringify(
      currentTree,
    )

  if (
    !themeChanged &&
    !treeChanged
  ) {
    return {
      ok: false,

      intent:
        parsed.intent,

      beforeTree,

      afterTree:
        currentTree,

      beforeTheme,

      afterTheme:
        currentTheme,

      changedThemeTokens:
        [...changedThemeTokens],

      multiChanges,

      warnings: [
        ...warnings,
        "La receta no produjo cambios efectivos.",
      ],
    }
  }

  return {
    ok: true,

    intent:
      parsed.intent,

    beforeTree,

    afterTree:
      currentTree,

    beforeTheme,

    afterTheme:
      currentTheme,

    changedThemeTokens:
      [...changedThemeTokens],

    multiChanges,

    warnings,
  }
}
