import type { EditorNode, EditorTree, NodeProps } from "../../../types/editor"
import { getExportHtmlSeoMetaModel, getExportJsxMetadataModel, getExportSeoModel } from "./exportDocument"
import { buildStaticExportCss, buildNextExportGlobalsCss } from "./exportCss"
import { buildNextExportScaffold } from "./exportNextScaffold"
import type { ExportSerializeOptions } from "./exportNodes"
import { renderHtmlExportNode, renderJsxExportNode } from "./exportRenderers"
import { buildHtmlDocument, buildNextLayoutTsx, buildNextPageTsx } from "./exportTemplates"
import { renderExportRootChildren } from "./exportTraversal"
import { buildHtmlStyleAttr, buildJsxStyleExpr } from "./exportStyle"

export interface HtmlExportArtifact {
  html: string
  css: string
  seo: { title: string; description: string }
}

export interface JsxExportArtifact {
  pageTsx: string
  layoutTsx: string
  globalsCss: string
  packageJson: string
  nextConfig: string
  readme: string
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeJsx(value: unknown) {
  return String(value ?? "").replace(/"/g, '\\"').replace(/`/g, "\\`")
}

function buildHtmlStyleAdapter(props: NodeProps) {
  return buildHtmlStyleAttr(props, escapeHtml)
}

function buildJsxStyleAdapter(props: NodeProps) {
  return buildJsxStyleExpr(props)
}

function renderHtmlBody(tree: EditorTree, options?: ExportSerializeOptions) {
  return renderExportRootChildren(
    tree,
    2,
    (context) => renderHtmlExportNode(context as {
      node: EditorNode
      props: Record<string, unknown>
      indent: string
      children: string
    }, options, {
      escape: escapeHtml,
      styleAttr: buildHtmlStyleAdapter,
    }),
    options
  )
}

function renderJsxBody(tree: EditorTree, options?: ExportSerializeOptions) {
  return renderExportRootChildren(
    tree,
    3,
    (context) => renderJsxExportNode(context as {
      node: EditorNode
      props: Record<string, unknown>
      indent: string
      children: string
    }, options, {
      escape: escapeJsx,
      styleExpr: buildJsxStyleAdapter,
    }),
    options
  )
}

export function buildHtmlExportArtifact(
  tree: EditorTree,
  siteName: string,
  options?: ExportSerializeOptions & { stylesHref?: string }
): HtmlExportArtifact {
  const rootNode = tree.nodes[tree.rootId]
  if (!rootNode) {
    return { html: "", css: "", seo: { title: siteName, description: "" } }
  }

  const bodyContent = renderHtmlBody(tree, options)
  const css = buildStaticExportCss(tree.theme ?? tree.globalTheme)
  const seo = getExportSeoModel(siteName, tree.seo)
  const meta = getExportHtmlSeoMetaModel(seo)
  const canonicalLine = meta.canonicalUrl
    ? `  <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
    : ""
  const openGraphLines = meta.openGraph
    .map((entry) => `  <meta property="${escapeHtml(entry.property)}" content="${escapeHtml(entry.content)}" />`)
    .join("\n")
  const twitterLines = meta.twitter
    .map((entry) => `  <meta name="${escapeHtml(entry.name)}" content="${escapeHtml(entry.content)}" />`)
    .join("\n")

  return {
    html: buildHtmlDocument({
      title: escapeHtml(seo.title),
      description: meta.description ? escapeHtml(meta.description) : "",
      keywords: meta.keywords ? escapeHtml(meta.keywords) : "",
      canonicalLine,
      openGraphLines,
      twitterLines,
      stylesHref: escapeHtml(options?.stylesHref ?? "styles.css"),
      bodyContent,
    }),
    css,
    seo,
  }
}

export function buildJsxExportArtifact(
  tree: EditorTree,
  siteName: string,
  options?: ExportSerializeOptions
): JsxExportArtifact {
  const bodyContent = renderJsxBody(tree, options)
  const theme = tree.theme ?? tree.globalTheme
  const seo = getExportSeoModel(siteName, tree.seo)
  const metadataModel = getExportJsxMetadataModel(seo)
  const scaffold = buildNextExportScaffold(siteName, seo.title, seo.description)

  return {
    pageTsx: buildNextPageTsx({
      metadata: {
        title: escapeJsx(metadataModel.title),
        description: metadataModel.description ? escapeJsx(metadataModel.description) : undefined,
        keywords: metadataModel.keywords ? escapeJsx(metadataModel.keywords) : undefined,
        openGraph: {
          title: escapeJsx(metadataModel.openGraph.title),
          description: metadataModel.openGraph.description ? escapeJsx(metadataModel.openGraph.description) : undefined,
          images: metadataModel.openGraph.images?.[0]?.url
            ? [{ url: escapeJsx(metadataModel.openGraph.images[0].url) }]
            : undefined,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: escapeJsx(metadataModel.twitter.title),
          description: metadataModel.twitter.description ? escapeJsx(metadataModel.twitter.description) : undefined,
          images: metadataModel.twitter.images?.[0]
            ? [escapeJsx(metadataModel.twitter.images[0])]
            : undefined,
        },
      },
      bodyContent,
    }),
    layoutTsx: buildNextLayoutTsx(escapeJsx(siteName)),
    globalsCss: buildNextExportGlobalsCss(theme),
    packageJson: scaffold.packageJson,
    nextConfig: scaffold.nextConfig,
    readme: scaffold.readme,
  }
}
