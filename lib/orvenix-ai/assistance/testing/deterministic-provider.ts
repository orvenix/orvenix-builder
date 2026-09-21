import type {
  DesignAssistanceProposalV1,
  DesignAssistanceProviderV1,
  DesignAssistanceRequestV1,
  DesignAssistanceThemeDirectionV1,
} from "../contract"

function baseThemeForRequest(request: DesignAssistanceRequestV1): DesignAssistanceThemeDirectionV1 {
  const accentByIndustry: Record<string, DesignAssistanceThemeDirectionV1["accentHue"]> = {
    health: "blue",
    restaurant: "orange",
    agency: "purple",
    ecommerce: "cyan",
    other: "neutral",
  }

  const style = request.context.styleBucket
  return {
    mode: "light",
    accentHue: accentByIndustry[request.context.industryBucket ?? "other"] ?? "neutral",
    contrastBucket: style === "minimal" ? "medium" : "high",
    radiusBucket: style === "professional" ? "soft" : style === "minimal" ? "sharp" : "pill",
    typographyBucket: style === "warm" ? "serif" : "sans",
    motionBucket: style === "minimal" ? "none" : "subtle",
  }
}

function mergePreservedTheme(
  request: DesignAssistanceRequestV1,
  theme: DesignAssistanceThemeDirectionV1,
): DesignAssistanceThemeDirectionV1 {
  if (request.constraints?.preserveTheme !== true || !request.constraints.theme) return theme

  return {
    ...theme,
    ...request.constraints.theme,
  }
}

export function createDeterministicDesignAssistanceProviderV1(): DesignAssistanceProviderV1 {
  return {
    async request(request: DesignAssistanceRequestV1): Promise<DesignAssistanceProposalV1> {
      return {
        version: 1,
        roleKey: request.roleKey,
        strategyKey: request.strategyKey,
        theme: mergePreservedTheme(request, baseThemeForRequest(request)),
      }
    },
  }
}
