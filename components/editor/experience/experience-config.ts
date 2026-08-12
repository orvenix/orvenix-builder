import type {
  EditorExperienceCapabilities,
  EditorExperienceMode,
} from "./types"

const CLIENT_CAPABILITIES: EditorExperienceCapabilities = {
  showAdvancedInspector: false,
  showTechnicalLayers: false,
  allowFreePosition: false,
  allowResize: false,
  allowStructureEditing: false,
  allowDestructiveActions: false,
  allowDeveloperTools: false,
}

const STUDIO_CAPABILITIES: EditorExperienceCapabilities = {
  showAdvancedInspector: true,
  showTechnicalLayers: true,
  allowFreePosition: true,
  allowResize: true,
  allowStructureEditing: true,
  allowDestructiveActions: true,
  allowDeveloperTools: true,
}

export function getExperienceCapabilities(
  mode: EditorExperienceMode,
): EditorExperienceCapabilities {
  return mode === "studio"
    ? STUDIO_CAPABILITIES
    : CLIENT_CAPABILITIES
}
