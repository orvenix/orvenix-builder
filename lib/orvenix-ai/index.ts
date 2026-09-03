import { buildPlan } from "./planner";
import { evaluateTreeQuality } from "./quality";

import type {
  OrvenixAIContext,
  OrvenixAIResult,
} from "./types";

export async function runOrvenixAI(
  context: OrvenixAIContext
): Promise<OrvenixAIResult> {
  try {
    const plan = buildPlan(context);

    const quality = context.tree
      ? evaluateTreeQuality(context.tree)
      : undefined;

    return {
      ok: true,
      plan,
      quality,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido de Orvenix AI.",
    };
  }
}

export * from "./multi";
export * from "./types";
export * from "./intent";
export * from "./planner";
export * from "./quality";

export * from "./capabilities"
export * from "./templates"

export * from "./architect"

export * from "./composer"

export * from "./compiler"

export * from "./content"
export * from "./autonomous"
export * from "./safety"
export * from "./mutation"
export * from "./policy"
export * from "./agent"
export * from "./local"
export * from "./section"
export * from "./context"

export * from "./design"
