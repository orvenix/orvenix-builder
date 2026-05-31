import type { EditorTree } from "@/types/editor";
import {
  DEFAULT_DOCUMENT_SEO,
  DEFAULT_DOCUMENT_THEME,
  normalizeDocumentSeo,
  normalizePublishedUrl,
} from "@/lib/builder-core/compiler/document";
import {
  buildDocumentCss,
  escapeHtml,
  renderNodeToHtml,
} from "@/lib/builder-core/compiler/html";

export function generateHtml(tree: EditorTree, theme = DEFAULT_DOCUMENT_THEME, seo = DEFAULT_DOCUMENT_SEO): string {
  const rootNode = tree.nodes[tree.rootId];
  if (!rootNode) {
    return "<html><body><h1>Error: No root node found.</h1></body></html>";
  }

  const normalizedSeo = normalizeDocumentSeo(seo);
  const renderedBody = renderNodeToHtml(rootNode, tree, theme);
  const normalizedOgImage = normalizePublishedUrl(normalizedSeo.ogImage);

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(normalizedSeo.title)}</title>
    <meta name="description" content="${escapeHtml(normalizedSeo.description)}">
    ${normalizedSeo.keywords ? `<meta name="keywords" content="${escapeHtml(normalizedSeo.keywords)}">` : ""}
    ${normalizedOgImage ? `<meta property="og:image" content="${escapeHtml(normalizedOgImage)}">` : ""}
    <style>
      ${buildDocumentCss(theme)}
    </style>
</head>
<body>
    <main>${renderedBody}</main>
</body>
</html>`;
}
