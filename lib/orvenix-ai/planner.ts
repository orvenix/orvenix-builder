import { randomUUID } from "crypto";
import { detectIntent } from "./intent";

import type {
  OrvenixAIContext,
  OrvenixAIPlan,
  OrvenixAIRisk,
} from "./types";

function riskForIntent(
  intent: OrvenixAIPlan["intent"]
): OrvenixAIRisk {
  switch (intent) {
    case "analyze_site":
      return "read";

    case "edit_content":
    case "edit_design":
    case "generate_copy":
    case "improve_seo":
    case "improve_conversion":
    case "improve_responsive":
      return "safe_write";

    case "create_site":
    case "redesign_site":
    case "improve_site":
    case "add_section":
    case "remove_section":
    case "reorder_sections":
      return "structural_write";

    default:
      return "read";
  }
}

export function buildPlan(
  context: OrvenixAIContext
): OrvenixAIPlan {
  const intent = detectIntent(context);
  const risk = riskForIntent(intent);

  return {
    id: randomUUID(),
    intent,
    objective: context.request,
    reasoning: [
      `Intención detectada: ${intent}.`,
      context.tree
        ? "Existe un EditorTree y puede analizarse antes de modificarlo."
        : "No se recibió un EditorTree actual.",
      risk === "structural_write"
        ? "La solicitud puede alterar la estructura del sitio."
        : "La solicitud no requiere una modificación estructural completa.",
    ],
    operations: [],
    risk,
    requiresExternalAI:
      intent === "create_site" ||
      intent === "redesign_site" ||
      intent === "generate_copy",
    requiresConfirmation: risk === "publish",
  };
}
