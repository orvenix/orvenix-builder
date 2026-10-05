import type { EditorTree } from "@/types/editor"
import { validateTree } from "@/types/validateTree"
import {
  isDemoShapeCommercialTreeV1,
  isHiddenCommercialPageV1,
  stripCommercialEmptyStatesV1,
} from "@/lib/orvenix-ai/commercial-designs/empty-states"
import {
  getResolvedSitePage,
  getResolvedSiteTheme,
  HOME_PAGE_NAME,
  HOME_PAGE_SLUG,
  listSitePages,
  type ResolvedSitePage,
  type ResolvedSiteTheme,
  type SitePageListItem,
} from "@/lib/builder-core/tree/sitePages"

export interface ResolvedSiteRuntimeContext {
  siteId: string
  page: ResolvedSitePage
  theme: ResolvedSiteTheme
  pages: SitePageListItem[]
  tree: EditorTree
  activePageSlug: string
  activePageName: string
}

export interface ResolvedSiteRuntimePageEntry extends ResolvedSiteRuntimeContext {
  isHome: boolean
}

export async function getResolvedSiteRuntimeContext(
  siteId: string,
  slug = HOME_PAGE_SLUG
): Promise<ResolvedSiteRuntimeContext | null> {
  const [page, theme, pages] = await Promise.all([
    getResolvedSitePage(siteId, slug),
    getResolvedSiteTheme(siteId),
    listSitePages(siteId),
  ])

  if (!page) {
    return null
  }

  /*
   * CV1-1b: this is the PUBLIC runtime (published site, owner preview,
   * publication, export). A demo-shape commercial site keeps explicit empty
   * states in the editor; here they are never published: a page that exists
   * only as an empty state is not public (404, out of the navigation, no
   * buttons to it) and every remaining empty state is stripped. Other sites
   * are untouched and pay no extra read.
   */
  const storedTree = validateTree(page.tree)
  let publicPages = pages
  let hiddenPageSlugs: ReadonlySet<string> = new Set()
  if (isDemoShapeCommercialTreeV1(storedTree)) {
    hiddenPageSlugs = await listHiddenCommercialPageSlugs(siteId, pages)
    if (hiddenPageSlugs.has(page.slug)) return null
    publicPages = pages.filter((entry) => !hiddenPageSlugs.has(entry.slug))
  }
  const tree = stripCommercialEmptyStatesV1(storedTree, { hiddenPageSlugs })
  const activePage = publicPages.find((entry) => entry.slug === page.slug)

  return {
    siteId,
    page,
    theme,
    pages: publicPages,
    tree: {
      ...tree,
      theme: theme.tokens,
      globalTheme: theme.tokens,
    },
    activePageSlug: page.slug,
    activePageName: activePage?.name ?? page.name ?? (page.slug === HOME_PAGE_SLUG ? HOME_PAGE_NAME : page.slug),
  }
}

async function listHiddenCommercialPageSlugs(siteId: string, pages: SitePageListItem[]): Promise<Set<string>> {
  const hidden = new Set<string>()
  for (const entry of pages) {
    if (entry.isHome || entry.slug === HOME_PAGE_SLUG) continue
    const resolved = await getResolvedSitePage(siteId, entry.slug)
    if (resolved && isHiddenCommercialPageV1(validateTree(resolved.tree))) hidden.add(entry.slug)
  }
  return hidden
}

export async function listResolvedSiteRuntimePages(siteId: string): Promise<ResolvedSiteRuntimePageEntry[]> {
  const pages = await listSitePages(siteId)
  if (pages.length === 0) {
    return []
  }

  const resolvedPages = await Promise.all(
    pages.map(async (entry) => {
      const context = await getResolvedSiteRuntimeContext(siteId, entry.slug)
      if (!context) {
        return null
      }

      return {
        ...context,
        isHome: entry.isHome || entry.slug === HOME_PAGE_SLUG,
      } satisfies ResolvedSiteRuntimePageEntry
    })
  )

  return resolvedPages.filter((entry): entry is ResolvedSiteRuntimePageEntry => entry !== null)
}
