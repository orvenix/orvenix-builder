"use server"

import { revalidatePath } from "next/cache"

import { getAuthSession } from "@/lib/auth-session"
import { canManageSite, type UserRole } from "@/lib/auth"
import { editorPrisma } from "@/lib/editor-db"
import { getEditorTreeFromDb } from "@/lib/editorPersistence"
import { getResolvedSitePage, HOME_PAGE_SLUG, listSitePages } from "@/lib/builder-core/tree/sitePages"
import { isFileStorageMode } from "@/lib/storage-mode"
import {
  applyBusinessFieldsUpdateToSiteV1,
  readBusinessFieldsV1,
  siteBusinessFieldUsesV1,
  type BusinessFieldKeyV1,
  type BusinessFieldsErrorsV1,
  type BusinessFieldsPatchV1,
  type BusinessFieldsSitePageV1,
  type BusinessFieldsV1,
} from "@/lib/commercial/business-fields"
import { validateTree } from "@/types/validateTree"
import type { EditorTree } from "@/types/editor"

/**
 * CV1-3 Business Fields V1: edit once, update every bound representation on
 * every page of the site in ONE transaction. Content only -- no planner, no
 * recompilation, no structural change (asserted per page).
 */

export type BusinessFieldsSummaryResult =
  | { success: true; fields: BusinessFieldsV1; uses: Partial<Record<BusinessFieldKeyV1, number>>; pageCount: number }
  | { success: false; message: string }

export type BusinessFieldsUpdateResult =
  | { success: true; fields: BusinessFieldsV1; tree: EditorTree; serverVersion: string | null; uses: Partial<Record<BusinessFieldKeyV1, number>> }
  | { success: false; message: string; errors?: BusinessFieldsErrorsV1 }

async function authorizedSiteId(siteId: unknown): Promise<string | null> {
  if (typeof siteId !== "string" || !siteId.trim() || siteId.length > 64) return null
  const session = await getAuthSession()
  if (!session?.user?.id) return null
  const allowed = await canManageSite(siteId, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  return allowed ? siteId : null
}

async function loadSitePages(siteId: string): Promise<BusinessFieldsSitePageV1[]> {
  const pages = await listSitePages(siteId)
  const loaded = await Promise.all(pages.map(async (entry) => {
    const page = await getResolvedSitePage(siteId, entry.slug)
    return page ? { slug: page.slug, isHome: entry.isHome || entry.slug === HOME_PAGE_SLUG, tree: validateTree(page.tree) } : null
  }))
  return loaded.filter((page): page is BusinessFieldsSitePageV1 => page !== null)
}

export async function getBusinessFieldsSummaryAction(siteId: string): Promise<BusinessFieldsSummaryResult> {
  const id = await authorizedSiteId(siteId)
  if (!id) return { success: false, message: "No tienes permiso para editar este sitio." }
  const pages = await loadSitePages(id)
  const fields = readBusinessFieldsV1(pages.find((page) => page.isHome)?.tree)
  if (!fields) return { success: false, message: "Este sitio no tiene datos de negocio conectados." }
  return { success: true, fields, uses: siteBusinessFieldUsesV1(pages.map((page) => page.tree)), pageCount: pages.length }
}

export async function updateBusinessFieldsAction(input: { siteId: string; pageSlug?: string; patch: BusinessFieldsPatchV1 }): Promise<BusinessFieldsUpdateResult> {
  const id = await authorizedSiteId(input?.siteId)
  if (!id) return { success: false, message: "No tienes permiso para editar este sitio." }
  if (isFileStorageMode()) return { success: false, message: "Los datos de negocio no están disponibles en este entorno." }

  const pages = await loadSitePages(id)
  const result = applyBusinessFieldsUpdateToSiteV1(pages, input.patch ?? {})
  if (!result.ok) {
    return { success: false, message: "message" in result && result.message ? result.message : "Revisa los datos marcados.", errors: "errors" in result ? result.errors : {} }
  }

  await editorPrisma.$transaction(async (tx) => {
    for (const page of result.pages) {
      const json = JSON.parse(JSON.stringify(page.tree))
      await tx.sitePage.update({
        where: { siteId_slug: { siteId: id, slug: page.slug } },
        data: { tree: json, ...(page.tree.seo ? { seo: JSON.parse(JSON.stringify(page.tree.seo)) } : {}) },
      })
      // The site-level tree mirrors the home page (same rule as the editor save).
      if (page.isHome) await tx.editorWebsite.update({ where: { id }, data: { tree: json } })
    }
  })

  revalidatePath(`/p/${id}`)
  const pageSlug = typeof input.pageSlug === "string" && input.pageSlug.trim() ? input.pageSlug.trim() : HOME_PAGE_SLUG
  const tree = await getEditorTreeFromDb(id, pageSlug)
  const resolved = await getResolvedSitePage(id, pageSlug)
  return {
    success: true,
    fields: result.fields,
    tree,
    serverVersion: resolved?.updatedAt?.toISOString() ?? null,
    uses: siteBusinessFieldUsesV1(result.pages.map((page) => page.tree)),
  }
}
