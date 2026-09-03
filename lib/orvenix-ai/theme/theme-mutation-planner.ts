import type {
  GlobalTheme,
} from "@/types/editor"

import {
  parseThemeMutation,
  type ParsedThemeMutation,
  type ThemeMutationPath,
} from "./theme-intent"

export interface ThemeMutationResult {
  ok: boolean

  beforeTheme:
    GlobalTheme

  afterTheme:
    GlobalTheme

  changedTokens:
    ThemeMutationPath[]

  warnings:
    string[]
}

function setPath(
  theme: GlobalTheme,
  path: ThemeMutationPath,
  value: string,
) {
  switch (path) {
    case "colors.primary":
      theme.colors = {
        ...theme.colors!,
        primary: value,
      }
      break

    case "colors.secondary":
      theme.colors = {
        ...theme.colors!,
        secondary: value,
      }
      break

    case "colors.background":
      theme.colors = {
        ...theme.colors!,
        background: value,
      }
      break

    case "colors.text":
      theme.colors = {
        ...theme.colors!,
        text: value,
      }
      break

    case "colors.accent":
      theme.colors = {
        ...theme.colors!,
        accent: value,
      }
      break

    case "fontHeading":
      theme.fontHeading =
        value
      break

    case "fontBody":
      theme.fontBody =
        value
      break

    case "spacing.sectionX":
      theme.spacing = {
        ...theme.spacing!,
        sectionX: value,
      }
      break

    case "spacing.sectionY":
      theme.spacing = {
        ...theme.spacing!,
        sectionY: value,
      }
      break

    case "spacing.stack":
      theme.spacing = {
        ...theme.spacing!,
        stack: value,
      }
      break

    case "radius.card":
      theme.radius = {
        ...theme.radius!,
        card: value,
      }
      break

    case "radius.button":
      theme.radius = {
        ...theme.radius!,
        button: value,
      }
      break
  }
}

function getPath(
  theme: GlobalTheme,
  path: ThemeMutationPath,
) {
  switch (path) {
    case "colors.primary":
      return theme.colors?.primary

    case "colors.secondary":
      return theme.colors?.secondary

    case "colors.background":
      return theme.colors?.background

    case "colors.text":
      return theme.colors?.text

    case "colors.accent":
      return theme.colors?.accent

    case "fontHeading":
      return theme.fontHeading

    case "fontBody":
      return theme.fontBody

    case "spacing.sectionX":
      return theme.spacing?.sectionX

    case "spacing.sectionY":
      return theme.spacing?.sectionY

    case "spacing.stack":
      return theme.spacing?.stack

    case "radius.card":
      return theme.radius?.card

    case "radius.button":
      return theme.radius?.button
  }
}

export function applyParsedThemeMutation(
  params: {
    theme: GlobalTheme
    parsed: ParsedThemeMutation
  },
): ThemeMutationResult {
  const beforeTheme =
    structuredClone(
      params.theme,
    )

  const afterTheme =
    structuredClone(
      params.theme,
    )

  const beforeValue =
    getPath(
      beforeTheme,
      params.parsed.path,
    )

  if (
    beforeValue ===
    params.parsed.value
  ) {
    return {
      ok: false,
      beforeTheme,
      afterTheme,
      changedTokens: [],
      warnings: [
        "El token global ya tiene el valor solicitado.",
      ],
    }
  }

  setPath(
    afterTheme,
    params.parsed.path,
    params.parsed.value,
  )

  return {
    ok: true,

    beforeTheme,
    afterTheme,

    changedTokens: [
      params.parsed.path,
    ],

    warnings: [],
  }
}

export function planThemeMutation(
  params: {
    theme: GlobalTheme
    request: string
  },
): ThemeMutationResult {
  const parsed =
    parseThemeMutation(
      params.request,
    )

  if (!parsed) {
    const theme =
      structuredClone(
        params.theme,
      )

    return {
      ok: false,

      beforeTheme:
        theme,

      afterTheme:
        structuredClone(
          theme,
        ),

      changedTokens: [],

      warnings: [
        "No se pudo interpretar la modificación global de diseño.",
      ],
    }
  }

  return applyParsedThemeMutation({
    theme:
      params.theme,

    parsed,
  })
}