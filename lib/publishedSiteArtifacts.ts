import { promises as fs } from "node:fs";
import path from "node:path";
import type { EditorTree } from "../types/editor";
import { serializeTreeToHtml } from "./export/serializeToHtml";
import type { SitePageListItem } from "./builder-core/tree/sitePages";

const publishedSitesRoot = path.join(process.cwd(), "public", "published-sites");
const STATIC_SAFE_BLOCKS = new Set([
  "section",
  "heading",
  "text",
  "ctaButton",
  "siteNav",
  "image",
  "genericWrapper",
]);

function getPublishedSiteDir(siteId: string) {
  return path.join(publishedSitesRoot, siteId);
}

function getPublishedSitePageDir(siteId: string, slug = "home") {
  return slug === "home" ? getPublishedSiteDir(siteId) : path.join(getPublishedSiteDir(siteId), slug);
}

function getPublishedSiteIndexPath(siteId: string, slug = "home") {
  return path.join(getPublishedSitePageDir(siteId, slug), "index.html");
}

function getPublishedSiteStylesPath(siteId: string) {
  return path.join(getPublishedSiteDir(siteId), "styles.css");
}

export interface PublishedArtifactPage {
  slug: string;
  name: string;
  tree: EditorTree;
  isHome?: boolean;
}

export function getPublishedSitePublicPath(siteId: string, slug = "home") {
  const basePath = `/published-sites/${encodeURIComponent(siteId)}`;
  return slug === "home" ? `${basePath}/` : `${basePath}/${encodeURIComponent(slug)}/`;
}

export function canPublishAsStaticHtml(tree: EditorTree) {
  return Object.values(tree.nodes).every((node) => STATIC_SAFE_BLOCKS.has(node.type));
}

export async function writePublishedSiteArtifact(siteId: string, tree: EditorTree) {
  return writePublishedSiteArtifacts(siteId, [
    {
      slug: "home",
      name: "Inicio",
      tree,
      isHome: true,
    },
  ]);
}

export async function writePublishedSiteArtifacts(
  siteId: string,
  pages: PublishedArtifactPage[],
  pageList: SitePageListItem[] = pages.map((page) => ({
    id: null,
    siteId,
    name: page.name,
    slug: page.slug,
    isHome: page.isHome ?? page.slug === "home",
    published: true,
    source: "site-page",
  }))
) {
  if (pages.length === 0) {
    throw new Error("No hay paginas para publicar");
  }

  const outputDir = getPublishedSiteDir(siteId);
  const sharedStyles =
    serializeTreeToHtml(pages[0].tree, pages[0].name, {
      siteId,
      stylesHref: "styles.css",
      currentPageSlug: pages[0].slug,
      pages: pageList,
    }).css;

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(getPublishedSiteStylesPath(siteId), sharedStyles, "utf8");

  await Promise.all(
    pages.map(async (page) => {
      const pageSlug = page.isHome ? "home" : page.slug;
      const outputFile = getPublishedSiteIndexPath(siteId, pageSlug);
      const stylesHref = page.isHome ? "styles.css" : "../styles.css";
      const { html } = serializeTreeToHtml(page.tree, page.name, {
        siteId,
        stylesHref,
        currentPageSlug: pageSlug,
        pages: pageList,
      });

      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      await fs.writeFile(outputFile, html, "utf8");
    })
  );

  return getPublishedSiteIndexPath(siteId);
}

export async function removePublishedSiteArtifact(siteId: string) {
  const outputDir = getPublishedSiteDir(siteId);
  await fs.rm(outputDir, { recursive: true, force: true });
}

export async function hasPublishedSiteArtifact(siteId: string, slug = "home") {
  try {
    await fs.access(getPublishedSiteIndexPath(siteId, slug));
    return true;
  } catch {
    return false;
  }
}
