import { blockRegistry } from "@/components/editor/blocks/registry"
import type {
  EditorBlockDefinition,
  SettingsField,
} from "@/types/editor"

export interface OrvenixCapabilityOption {
  value:
    | string
    | number

  label: string
  icon?: string
}

export interface OrvenixCapabilitySetting {
  key?: string
  label: string
  kind: string

  options?:
    OrvenixCapabilityOption[]

  presets?:
    string[]

  min?: number
  max?: number
  step?: number

  clearable?: boolean
}

export interface OrvenixCapabilityOption {
  value:
    | string
    | number

  label: string
  icon?: string
}

export interface OrvenixBlockCapability {
  type: string
  label: string
  description: string
  category: string
  acceptsChildren: boolean
  children: string[]
  settings:
  OrvenixCapabilitySetting[]
  defaults: Record<string, unknown>
  version: number
}

function flattenSettings(
  settings:
    readonly SettingsField[]
    | undefined,
): OrvenixCapabilitySetting[] {
  if (!settings) {
    return []
  }

  const result:
    OrvenixCapabilitySetting[] =
      []

  for (const field of settings) {
    /*
     * Los grupos sirven para organizar
     * visualmente el Inspector, pero no
     * representan una prop editable.
     *
     * Conservamos únicamente campos
     * editables en la capability plana.
     */
    if (
      field.kind !== "group"
    ) {
      result.push({
        key:
          field.key,

        label:
          field.label,

        kind:
          field.kind,

        options:
          field.options
            ? field.options.map(
                (option) => ({
                  value:
                    option.value,

                  label:
                    option.label,

                  icon:
                    option.icon,
                }),
              )
            : undefined,

        presets:
          field.presets
            ? [...field.presets]
            : undefined,

        min:
          field.min,

        max:
          field.max,

        step:
          field.step,

        clearable:
          field.clearable,
      })
    }

    /*
     * Los campos reales pueden estar
     * anidados dentro de grupos.
     */
    if (
      Array.isArray(
        field.fields,
      ) &&
      field.fields.length > 0
    ) {
      result.push(
        ...flattenSettings(
          field.fields,
        ),
      )
    }
  }

  return result
}

export function getBlockCapabilities(): OrvenixBlockCapability[] {
  return Object.entries(blockRegistry).map(([type, rawDefinition]) => {
    const definition =
      rawDefinition as EditorBlockDefinition

    return {
      type,
      label: definition.label ?? type,
      description: definition.description ?? "",
      category: definition.category ?? "general",
      acceptsChildren: Boolean(definition.acceptsChildren),
      children: [...(definition.children ?? [])],
      settings: flattenSettings(definition.settings),
      defaults: {
        ...(definition.defaults ?? {}),
      },
      version: definition.version ?? 1,
    }
  })
}

export function getCapabilitySetting(
  blockType: string,
  key: string,
): OrvenixCapabilitySetting | null {
  const capability =
    getBlockCapability(
      blockType,
    )

  if (!capability) {
    return null
  }

  return (
    capability.settings.find(
      (setting) =>
        setting.key === key,
    ) ?? null
  )
}

export function isCapabilityValueAllowed(
  blockType: string,
  key: string,
  value: unknown,
): boolean {
  const setting =
    getCapabilitySetting(
      blockType,
      key,
    )

  if (!setting) {
    return false
  }

  /*
   * Select / segmented:
   * el Registry define valores cerrados.
   */
  if (
    setting.options &&
    setting.options.length > 0
  ) {
    return setting.options.some(
      (option) =>
        option.value ===
        value,
    )
  }

  /*
   * Number:
   * respetamos min / max cuando existen.
   */
  if (
    setting.kind === "number"
  ) {
    if (
      typeof value !==
      "number"
    ) {
      return false
    }

    if (
      setting.min !==
        undefined &&
      value < setting.min
    ) {
      return false
    }

    if (
      setting.max !==
        undefined &&
      value > setting.max
    ) {
      return false
    }

    return true
  }

  /*
   * Color:
   * el valor no tiene que pertenecer
   * necesariamente a presets.
   * Los presets son sugerencias UI.
   */
  if (
    setting.kind === "color"
  ) {
    return (
      typeof value ===
        "string" &&
      value.length > 0
    )
  }

  /*
   * Text / textarea y otros campos
   * abiertos pueden aceptar strings.
   */
  if (
    setting.kind === "text" ||
    setting.kind ===
      "textarea"
  ) {
    return (
      typeof value ===
      "string"
    )
  }

  /*
   * Toggle.
   */
  if (
    setting.kind ===
    "toggle"
  ) {
    return (
      typeof value ===
      "boolean"
    )
  }

  return false
}

export function getBlockCapability(
  type: string,
): OrvenixBlockCapability | null {
  return (
    getBlockCapabilities().find(
      (block) => block.type === type,
    ) ?? null
  )
}

export function getBlocksByCategory(
  category: string,
): OrvenixBlockCapability[] {
  const normalized = category.toLowerCase()

  return getBlockCapabilities().filter(
    (block) =>
      block.category.toLowerCase() === normalized,
  )
}

export function searchBlockCapabilities(
  query: string,
): OrvenixBlockCapability[] {
  const normalized = query.toLowerCase().trim()

  if (!normalized) return getBlockCapabilities()

  return getBlockCapabilities().filter((block) => {
    const haystack = [
      block.type,
      block.label,
      block.description,
      block.category,
      ...block.settings.map((setting) => setting.label),
    ]
      .join(" ")
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
