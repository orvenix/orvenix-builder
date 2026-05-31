import type { EditorTree } from "@/types/editor";
import { getResolvedSiteRuntimeContext } from "@/lib/builder-core/tree/siteRuntimeContext";

export async function getResolvedEditorTree(siteId: string, slug?: string): Promise<EditorTree | null> {
  const context = await getResolvedSiteRuntimeContext(siteId, slug);
  return context?.tree ?? null;
}
