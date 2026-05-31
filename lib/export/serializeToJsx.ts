import type { EditorTree } from "../../types/editor"
import type { SitePageListItem } from "../builder-core/tree/sitePages"
import { buildJsxExportArtifact, type JsxExportArtifact } from "../builder-core/compiler/exportPipelines"

export type JsxExportResult = JsxExportArtifact

export function serializeTreeToJsx(
  tree: EditorTree,
  siteName: string,
  options?: { siteId?: string | null; currentPageSlug?: string; pages?: SitePageListItem[] }
): JsxExportResult {
  return buildJsxExportArtifact(tree, siteName, options)
}
