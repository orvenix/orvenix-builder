import {
  getEditorTreeFromDb,
} from "@/lib/editorPersistence"

import {
  runAutonomousSiteBuilder,
} from "@/lib/orvenix-ai/autonomous"

import {
  createDryRunMutationPlan,
} from "./dry-run"

import type {
  OrvenixAIMutationPlan,
} from "./types"

export interface RealSiteDryRunInput {
  siteId: string
  pageSlug?: string

  request: string

  business: {
    name: string
    industry: string
    location?: string
    description?: string
    objective?: string

    services?: Array<{
      name: string
      description?: string
    }>
  }

  minimumQuality?: number
}

export async function createRealSiteDryRun(
  input: RealSiteDryRunInput,
): Promise<OrvenixAIMutationPlan> {
  /*
   * 1. Leer exclusivamente.
   *
   * Esta operación NO escribe
   * absolutamente nada.
   */
  const before =
    await getEditorTreeFromDb(
      input.siteId,
      input.pageSlug ?? "home",
    )

  /*
   * 2. Generar propuesta autónoma.
   */
  const generated =
    await runAutonomousSiteBuilder({
      request:
        input.request,

      business:
        input.business,

      minimumQuality:
        input.minimumQuality,
    })

  if (!generated.ok) {
    throw new Error(
      "Orvenix AI no pudo generar una propuesta válida.",
    )
  }

  /*
   * 3. Crear snapshot en memoria
   * y calcular diferencias.
   *
   * Seguimos SIN escribir.
   */
  return createDryRunMutationPlan({
    siteId:
      input.siteId,

    before,

    after:
      generated.tree,
  })
}
