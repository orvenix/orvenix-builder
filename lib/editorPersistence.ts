import { editorPrisma } from "@/lib/editor-db";
import type { Prisma } from "@/generated/editor-prisma";
import {
  getDefaultStarterEditorTree,
  getEditorTreeForWeb,
  isEditorWebId,
  WEB_LABELS,
  type EditorWebId,
} from "@/lib/editorWebs";
import {
  ensureHomePage,
  getResolvedSitePage,
  getResolvedSiteTheme,
  saveResolvedPageTree,
  saveResolvedSiteTheme,
} from "@/lib/builder-core/tree/sitePages";
import { validateTree } from "@/types/validateTree";
import type { EditorTree } from "@/types/editor";

function toPrismaJson(tree: EditorTree): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(tree)) as Prisma.InputJsonValue;
}

function isBlankEditorTree(tree: EditorTree) {
  const root = tree.nodes[tree.rootId];
  return !root || root.children.length === 0;
}

export async function getEditorTreeFromDb(id: string, pageSlug = "home"): Promise<EditorTree> {
  const existing = await editorPrisma.editorWebsite.findUnique({ where: { id } });

  if (!existing) {
    // Si es un ID de demo hardcodeado, inicializar con el árbol por defecto
    if (isEditorWebId(id)) {
      const tree = getEditorTreeForWeb(id as EditorWebId);
      await editorPrisma.editorWebsite.create({
        data: { id, name: WEB_LABELS[id as EditorWebId], tree: toPrismaJson(tree) },
      });
      return tree;
    }
    throw new Error(`Sitio "${id}" no encontrado.`);
  }

  const resolvedPage = await getResolvedSitePage(id, pageSlug);
  if (!resolvedPage) {
    throw new Error(`Sitio "${id}" no tiene una pagina resoluble.`);
  }

  const tree = validateTree(resolvedPage.tree);
  const resolvedTheme = await getResolvedSiteTheme(id);
  const resolvedTree = {
    ...tree,
    theme: resolvedTheme.tokens,
    globalTheme: resolvedTheme.tokens,
  };
  if (isBlankEditorTree(resolvedTree)) {
    const starterTree = getDefaultStarterEditorTree();
    await saveEditorTreeToDb(id, starterTree);
    return starterTree;
  }

  return resolvedTree;
}

export async function saveEditorTreeToDb(
  id: string,
  rawTree: unknown,
  pageSlug = "home"
): Promise<EditorTree> {
  const tree = validateTree(rawTree);

  // Para IDs de demo, usar el label hardcodeado; para user sites usar el nombre existente
  const name = isEditorWebId(id) ? WEB_LABELS[id as EditorWebId] : undefined;

  await editorPrisma.editorWebsite.upsert({
    where: { id },
    update: {
      ...(name ? { name } : {}),
      tree: toPrismaJson(tree),
    },
    create: {
      id,
      name: name ?? id,
      tree: toPrismaJson(tree),
    },
  });

  await ensureHomePage(id);
  await saveResolvedPageTree(id, pageSlug, tree);
  await saveResolvedSiteTheme(id, tree.theme ?? tree.globalTheme);

  return tree;
}
