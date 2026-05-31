import type { EditorTree } from "@/types/editor"
import { validateTree } from "@/types/validateTree"
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

  const tree = validateTree(page.tree)
  const activePage = pages.find((entry) => entry.slug === page.slug)

  return {
    siteId,
    page,
    theme,
    pages,
    tree: {
      ...tree,
      theme: theme.tokens,
      globalTheme: theme.tokens,
    },
    activePageSlug: page.slug,
    activePageName: activePage?.name ?? page.name ?? (page.slug === HOME_PAGE_SLUG ? HOME_PAGE_NAME : page.slug),
  }
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
