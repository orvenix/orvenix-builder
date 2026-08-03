import { randomBytes } from "crypto"

import { editorPrisma } from "@/lib/editor-db"
import {
  getEditorTreeFromDb,
  saveEditorTreeToDb,
} from "@/lib/editorPersistence"

import {
  getDefaultStarterEditorTree,
} from "@/lib/editorWebs"

import type {
  CertificationGroup,
  CertificationResult,
} from "./types"

async function runCheck(
  id: string,
  title: string,
  callback: () => Promise<{
    status?: "passed" | "warning"
    message: string
    details?: Record<string, unknown>
  }>
): Promise<CertificationResult> {
  const startedAt = Date.now()

  try {
    const result = await callback()

    return {
      id,
      title,
      status: result.status ?? "passed",
      message: result.message,
      durationMs: Date.now() - startedAt,
      details: result.details,
    }
  } catch (error) {
    return {
      id,
      title,
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : String(error),
      durationMs: Date.now() - startedAt,
    }
  }
}

export async function runBuilderCertification(): Promise<CertificationGroup> {
  const results: CertificationResult[] = []

  const suffix = randomBytes(6).toString("hex")
  const siteId = `cert_builder_${suffix}`

  let siteCreated = false

  try {
    results.push(
      await runCheck(
        "builder.create-site",
        "Creación de sitio temporal",
        async () => {
          const tree = getDefaultStarterEditorTree()

          await editorPrisma.editorWebsite.create({
            data: {
              id: siteId,
              name: `Certificación Builder ${suffix}`,
              description:
                "Sitio temporal creado automáticamente por System Certification.",
              tree: JSON.parse(
                JSON.stringify(tree)
              ),
              published: false,
            },
          })

          siteCreated = true

          const created =
            await editorPrisma.editorWebsite.findUnique({
              where: {
                id: siteId,
              },
              select: {
                id: true,
                published: true,
              },
            })

          if (!created) {
            throw new Error(
              "El sitio temporal no pudo recuperarse después de crearlo."
            )
          }

          if (created.published) {
            throw new Error(
              "El sitio temporal fue creado como publicado inesperadamente."
            )
          }

          return {
            message:
              "El Builder puede crear y recuperar un sitio temporal.",
            details: {
              siteId,
              published: false,
            },
          }
        }
      )
    )

    results.push(
      await runCheck(
        "builder.initial-persistence",
        "Persistencia inicial del árbol",
        async () => {
          const tree =
            await getEditorTreeFromDb(
              siteId,
              "home"
            )

          if (!tree?.rootId) {
            throw new Error(
              "El árbol recuperado no contiene rootId."
            )
          }

          if (!tree.nodes?.[tree.rootId]) {
            throw new Error(
              "El nodo raíz no existe en el árbol recuperado."
            )
          }

          return {
            message:
              "El árbol inicial puede guardarse y recuperarse correctamente.",
            details: {
              rootId: tree.rootId,
              nodeCount:
                Object.keys(tree.nodes).length,
            },
          }
        }
      )
    )

    results.push(
      await runCheck(
        "builder.save-reload",
        "Guardar y recargar cambios",
        async () => {
          const original =
            await getEditorTreeFromDb(
              siteId,
              "home"
            )

          const marker =
            `ORVENIX_CERT_${suffix}`

          const modified = {
            ...original,
            seo: {
              ...(original.seo ?? {}),
              title: marker,
            },
          }

          await saveEditorTreeToDb(
            siteId,
            modified,
            "home"
          )

          const reloaded =
            await getEditorTreeFromDb(
              siteId,
              "home"
            )

          if (
            reloaded.seo?.title !== marker
          ) {
            throw new Error(
              "El cambio guardado no sobrevivió a una nueva lectura desde la persistencia."
            )
          }

          return {
            message:
              "Los cambios del Builder sobreviven al guardado y a una recarga posterior.",
            details: {
              markerPersisted: true,
            },
          }
        }
      )
    )

    results.push(
      await runCheck(
        "builder.home-page-sync",
        "Sincronización de página Home",
        async () => {
          const site =
            await editorPrisma.editorWebsite.findUnique({
              where: {
                id: siteId,
              },
              select: {
                tree: true,
              },
            })

          const homePage =
            await editorPrisma.sitePage.findFirst({
              where: {
                siteId,
                slug: "home",
              },
              select: {
                id: true,
                tree: true,
                isHome: true,
              },
            })

          if (!site) {
            throw new Error(
              "No existe EditorWebsite después del guardado."
            )
          }

          if (!homePage) {
            throw new Error(
              "No se creó o sincronizó SitePage para home."
            )
          }

          if (!homePage.isHome) {
            throw new Error(
              "La página home no está marcada como isHome."
            )
          }

          const siteTree =
            JSON.stringify(site.tree)

          const pageTree =
            JSON.stringify(homePage.tree)

          if (siteTree !== pageTree) {
            throw new Error(
              "EditorWebsite.tree y SitePage.tree no están sincronizados."
            )
          }

          return {
            message:
              "EditorWebsite.tree y SitePage.tree están sincronizados para home.",
            details: {
              sitePageId:
                homePage.id,
              synchronized: true,
            },
          }
        }
      )
    )
  } finally {
  if (siteCreated) {
    await editorPrisma.$executeRaw`
      DELETE FROM site_pages
      WHERE siteId = ${siteId}
    `

    await editorPrisma.$executeRaw`
      DELETE FROM site_themes
      WHERE siteId = ${siteId}
    `

    await editorPrisma.$executeRaw`
      DELETE FROM editor_websites
      WHERE id = ${siteId}
    `
  }
}


  return {
    id: "builder",
    title: "Builder",
    results,
  }
}
