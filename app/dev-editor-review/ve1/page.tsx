import { notFound } from "next/navigation"

import { EditorExperienceShell } from "@/components/editor/experience"
import { EditorProvider } from "@/components/editor/store/EditorProvider"
import { getVe1ReviewSitePages } from "@/lib/editor/fixtures/ve1-review-tree"

export const dynamic = "force-dynamic"

/** A distinct draft id so no local draft of an earlier review fixture is recovered into this one. */
const REVIEW_SITE_ID = "draft:ve1-review-construction"

/**
 * VE-1: DEV-ONLY human review of the REAL customer editor (EditorProvider +
 * EditorExperienceShell in client mode) on the compiled Construction
 * commercial demo (deterministic, no DB, no providers). The `draft:`
 * website id is refused by saveToServer/autosave, so nothing reaches the
 * server or the database. Never available in production.
 */
export default async function DevEditorVe1ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const { page: requestedSlug } = await searchParams
  const pages = await getVe1ReviewSitePages()
  const page = pages.find((entry) => entry.slug === requestedSlug) ?? pages.find((entry) => entry.isHome) ?? pages[0]

  return (
    <EditorProvider
      websiteId={REVIEW_SITE_ID}
      initialTree={page.tree}
      initialUserRole="client"
      initialBuilderTier="basic"
      initialPageSlug={page.slug}
      initialPageName={page.name}
      availablePages={pages.map((entry) => ({ id: null, siteId: REVIEW_SITE_ID, name: entry.name, slug: entry.slug, isHome: entry.isHome, published: false, source: "site-page" as const }))}
    >
      <div className="ov-shell editor-shell-page relative flex h-screen flex-col overflow-hidden text-white">
        <EditorExperienceShell />
      </div>
    </EditorProvider>
  )
}
