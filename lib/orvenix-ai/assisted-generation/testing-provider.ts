import type { AssistedSiteGenerationProviderV1 } from "./contract"

export function createDeterministicAssistedSiteGenerationProviderV1(response: unknown): AssistedSiteGenerationProviderV1 {
  return {
    async request() {
      return structuredClone(response)
    },
  }
}
