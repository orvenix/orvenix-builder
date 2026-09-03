export type EditorExperienceMode = "client" | "studio"

export interface EditorExperienceCapabilities {
  showAdvancedInspector: boolean
  showTechnicalLayers: boolean
  allowFreePosition: boolean
  allowResize: boolean
  allowStructureEditing: boolean
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
