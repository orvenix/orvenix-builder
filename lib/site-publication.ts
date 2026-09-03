import {
  canManageSite,
  publishSite,
  type UserRole,
} from "@/lib/auth"

import {
  listResolvedSiteRuntimePages,
} from "@/lib/builder-core/tree/siteRuntimeContext"

import {
  canPublishAsStaticHtml,
  removePublishedSiteArtifact,
  writePublishedSiteArtifacts,
} from "@/lib/publishedSiteArtifacts"

export type SitePublicationMode =
  | "static-artifact"
  | "dynamic-renderer"

export interface SitePublicationActor {
  userId: string
  role: UserRole
}

export interface SitePublicationResult {
  url: string

  publicationMode:
    SitePublicationMode

  pageCount: number
}

export class SitePublicationError
  extends Error {
  constructor(
    message: string,

    public readonly code:
      | "SITE_ID_REQUIRED"
      | "FORBIDDEN"
      | "SITE_NOT_FOUND"
      | "SITE_PUBLISH_FAILED",
  ) {
    super(message)

    this.name =
      "SitePublicationError"
  }
}

async function updatePublishedStatus(
  siteId: string,
  actor: SitePublicationActor,
) {
  if (actor.role === "ADMIN") {
    const {
      editorPrisma,
    } = await import(
      "@/lib/editor-db"
    )

    const result =
      await editorPrisma
        .editorWebsite
        .updateMany({
          where: {
            id:
              siteId,
          },

          data: {
            published:
              true,
          },
        })

    return result.count
  }

  const result =
    await publishSite(
      siteId,
      actor.userId,
    )

  return result.count
}

export async function publishSiteForActor(
  params: {
    siteId: string
    actor: SitePublicationActor
  },
): Promise<SitePublicationResult> {
  const siteId =
    params.siteId.trim()

  if (!siteId) {
    throw new SitePublicationError(
      "ID de sitio requerido.",
      "SITE_ID_REQUIRED",
    )
  }

  const allowed =
    await canManageSite(
      siteId,
      params.actor.userId,
      params.actor.role,
    )

  if (!allowed) {
    throw new SitePublicationError(
      "No tienes permiso para publicar este sitio.",
      "FORBIDDEN",
    )
  }

  const runtimePages =
    await listResolvedSiteRuntimePages(
      siteId,
    )

  if (runtimePages.length === 0) {
    throw new SitePublicationError(
      "Sitio no encontrado.",
      "SITE_NOT_FOUND",
    )
  }

  const publishablePages =
    runtimePages.map(
      (page) => ({
        slug:
          page.activePageSlug,

        name:
          page.activePageName,

        isHome:
          page.isHome,

        tree:
          page.tree,
      }),
    )

  const staticArtifactReady =
    publishablePages.every(
      (page) =>
        canPublishAsStaticHtml(
          page.tree,
        ),
    )

  if (staticArtifactReady) {
    await writePublishedSiteArtifacts(
      siteId,
      publishablePages,
      runtimePages[0]?.pages,
    )
  } else {
    await removePublishedSiteArtifact(
      siteId,
    )
  }

  const updatedCount =
    await updatePublishedStatus(
      siteId,
      params.actor,
    )

  if (updatedCount === 0) {
    await removePublishedSiteArtifact(
      siteId,
    )

    throw new SitePublicationError(
      "Sitio no encontrado o acceso revocado.",
      "SITE_NOT_FOUND",
    )
  }

  return {
    url:
      `/p/${siteId}`,

    publicationMode:
      staticArtifactReady
        ? "static-artifact"
        : "dynamic-renderer",

    pageCount:
      publishablePages.length,
  }
}

export function createSitePublicationCapability(
  actor: SitePublicationActor,
) {
  return async (
    params: {
      siteId: string
    },
  ): Promise<SitePublicationResult> =>
    publishSiteForActor({
      siteId:
        params.siteId,

      actor,
    })
}
