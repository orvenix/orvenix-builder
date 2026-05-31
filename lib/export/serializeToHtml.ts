import type { EditorTree } from "../../types/editor"
import type { SitePageListItem } from "../builder-core/tree/sitePages"
import { buildHtmlExportArtifact, type HtmlExportArtifact } from "../builder-core/compiler/exportPipelines"

export type HtmlExportResult = HtmlExportArtifact

export function serializeTreeToHtml(
  tree: EditorTree,
  siteName: string,
  options?: { siteId?: string | null; stylesHref?: string; currentPageSlug?: string; pages?: SitePageListItem[] }
): HtmlExportResult {
  return buildHtmlExportArtifact(tree, siteName, options)
}
