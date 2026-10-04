export type EditorExperienceMode = "client" | "studio"

export interface EditorExperienceCapabilities {
  showAdvancedInspector: boolean
  showTechnicalLayers: boolean
  allowFreePosition: boolean
  allowResize: boolean
  /** Low-level structure mutation (any node, free drops, paste at canvas points). */
  allowStructureEditing: boolean
  /** VE-1: semantic reordering of the page's top-level sections (child order only, never x/y). */
  allowSectionReorder: boolean
  /** VE-1: canvas selection navigation (breadcrumb, Escape to parent, arrow-key siblings). */
  allowSelectionNavigation: boolean
  allowDestructiveActions: boolean
  allowDeveloperTools: boolean
}

export interface EditorExperienceValue {
  mode: EditorExperienceMode
  isClient: boolean
  isStudio: boolean
  canSwitchMode: boolean
  setMode: (mode: EditorExperienceMode) => void
  capabilities: EditorExperienceCapabilities
}
