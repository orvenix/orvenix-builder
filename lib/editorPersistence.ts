import { editorPrisma } from "@/lib/editor-db";
import type { Prisma } from "@/generated/editor-prisma";
import {
  getEditorTreeForWeb,
  isEditorWebId,
  WEB_LABELS,
  type EditorWebId,
} from "@/lib/editorWebs";
import {
  HOME_PAGE_SLUG,
  ensureHomePage,
  getResolvedSitePage,
  getResolvedSiteTheme,
  normalizeSitePageSlug,
  saveResolvedPageTree,
  saveResolvedSiteTheme,
} from "@/lib/builder-core/tree/sitePages";
import { calculateSiteCreationTreeHash } from "@/lib/orvenix-ai/site-creation/plan-v2";
import { markDesignGenerationEdited } from "@/lib/orvenix-ai/design-memory";
import { validateTree } from "@/types/validateTree";
import type { EditorTree } from "@/types/editor";
import { materializeBusinessFieldsV1, readBusinessFieldsV1 } from "@/lib/commercial/business-fields";

function toPrismaJson(tree: EditorTree): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(tree)) as Prisma.InputJsonValue;
}

function hashPersistedTree(value: unknown) {
  if (!value) return null;

  try {
    return calculateSiteCreationTreeHash(validateTree(value));
  } catch {
    return null;
  }
}

/**
 * CV1-3 invariant: on a site with Business Fields, the stored HOME tree holds
 * the authority. Whatever tree a client saves (any page, any editor mode),
 * its bound values and replicas are re-derived from that authority, so a
 * bound node can never keep an independent value. Legacy sites (no
 * authority) are saved exactly as before.
 */
async function enforceBusinessFieldsAuthority(id: string, tree: EditorTree): Promise<EditorTree> {
  const home = await getResolvedSitePage(id, HOME_PAGE_SLUG);
  // Read only the authority key: a missing or malformed home tree means "no
  // authority", never a failed save (sites without Business Fields are unaffected).
  const homeTree = home?.tree;
  const authority = homeTree && typeof homeTree === "object" && !Array.isArray(homeTree)
    ? readBusinessFieldsV1(homeTree as EditorTree)
    : null;
  return authority ? materializeBusinessFieldsV1(tree, authority) : tree;
}

async function getPersistedTreeHash(id: string, pageSlug: string) {
  const page = await getResolvedSitePage(id, pageSlug);
  return hashPersistedTree(page?.tree ?? null);
}

async function markDesignMemoryEditedBestEffort(id: string) {
  try {
    await markDesignGenerationEdited({ siteId: id });
  } catch (error) {
    console.error(
      "[Orvenix Design Memory] No se pudo marcar la generacion como editada:",
      error,
    );
  }
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
  return resolvedTree;
}

export async function saveEditorTreeToDb(
  id: string,
  rawTree: unknown,
  pageSlug = "home",
  options?: {
    /**
     * Runs before a save would create a page that does not exist yet, so the
     * caller can apply the plan's page limit (SALES-2). Throwing aborts the
     * save before anything is written.
     */
    beforeCreatePage?: () => Promise<unknown>;
  }
): Promise<EditorTree> {
  if (options?.beforeCreatePage && pageSlug !== HOME_PAGE_SLUG) {
    const targetSlug = normalizeSitePageSlug(pageSlug);
    if (targetSlug !== HOME_PAGE_SLUG && !(await getResolvedSitePage(id, targetSlug))) {
      await options.beforeCreatePage();
    }
  }

  const previousHash = await getPersistedTreeHash(id, pageSlug);
  const tree = await enforceBusinessFieldsAuthority(id, validateTree(rawTree));
  const nextHash = calculateSiteCreationTreeHash(tree);

  // Para IDs de demo, usar el label hardcodeado; para user sites usar el nombre existente
  const name = isEditorWebId(id) ? WEB_LABELS[id as EditorWebId] : undefined;
  const requestedHomePage = pageSlug === HOME_PAGE_SLUG;
  const existingSite = await editorPrisma.editorWebsite.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingSite || requestedHomePage) {
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
  } else if (name) {
    await editorPrisma.editorWebsite.update({
      where: { id },
      data: { name },
    });
  }

  await ensureHomePage(id);
  await saveResolvedPageTree(id, pageSlug, tree);
  await saveResolvedSiteTheme(id, tree.theme ?? tree.globalTheme);

  if (previousHash && previousHash !== nextHash) {
    await markDesignMemoryEditedBestEffort(id);
  }

  return tree;
}
