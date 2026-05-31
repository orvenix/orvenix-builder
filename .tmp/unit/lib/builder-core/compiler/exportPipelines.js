"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHtmlExportArtifact = buildHtmlExportArtifact;
exports.buildJsxExportArtifact = buildJsxExportArtifact;
const exportDocument_1 = require("./exportDocument");
const exportCss_1 = require("./exportCss");
const exportNextScaffold_1 = require("./exportNextScaffold");
const exportRenderers_1 = require("./exportRenderers");
const exportTemplates_1 = require("./exportTemplates");
const exportTraversal_1 = require("./exportTraversal");
const exportStyle_1 = require("./exportStyle");
function escapeHtml(value) {
    return String(value !== null && value !== void 0 ? value : "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function escapeJsx(value) {
    return String(value !== null && value !== void 0 ? value : "").replace(/"/g, '\\"').replace(/`/g, "\\`");
}
function buildHtmlStyleAdapter(props) {
    return (0, exportStyle_1.buildHtmlStyleAttr)(props, escapeHtml);
}
function buildJsxStyleAdapter(props) {
    return (0, exportStyle_1.buildJsxStyleExpr)(props);
}
function renderHtmlBody(tree, options) {
    return (0, exportTraversal_1.renderExportRootChildren)(tree, 2, (context) => (0, exportRenderers_1.renderHtmlExportNode)(context, options, {
        escape: escapeHtml,
        styleAttr: buildHtmlStyleAdapter,
    }), options);
}
function renderJsxBody(tree, options) {
    return (0, exportTraversal_1.renderExportRootChildren)(tree, 3, (context) => (0, exportRenderers_1.renderJsxExportNode)(context, options, {
        escape: escapeJsx,
        styleExpr: buildJsxStyleAdapter,
    }), options);
}
function buildHtmlExportArtifact(tree, siteName, options) {
    var _a, _b;
    const rootNode = tree.nodes[tree.rootId];
    if (!rootNode) {
        return { html: "", css: "", seo: { title: siteName, description: "" } };
    }
    const bodyContent = renderHtmlBody(tree, options);
    const css = (0, exportCss_1.buildStaticExportCss)((_a = tree.theme) !== null && _a !== void 0 ? _a : tree.globalTheme);
    const seo = (0, exportDocument_1.getExportSeoModel)(siteName, tree.seo);
    const meta = (0, exportDocument_1.getExportHtmlSeoMetaModel)(seo);
    const canonicalLine = meta.canonicalUrl
        ? `  <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`
        : "";
    const openGraphLines = meta.openGraph
        .map((entry) => `  <meta property="${escapeHtml(entry.property)}" content="${escapeHtml(entry.content)}" />`)
        .join("\n");
    const twitterLines = meta.twitter
        .map((entry) => `  <meta name="${escapeHtml(entry.name)}" content="${escapeHtml(entry.content)}" />`)
        .join("\n");
    return {
        html: (0, exportTemplates_1.buildHtmlDocument)({
            title: escapeHtml(seo.title),
            description: meta.description ? escapeHtml(meta.description) : "",
            keywords: meta.keywords ? escapeHtml(meta.keywords) : "",
            canonicalLine,
            openGraphLines,
            twitterLines,
            stylesHref: escapeHtml((_b = options === null || options === void 0 ? void 0 : options.stylesHref) !== null && _b !== void 0 ? _b : "styles.css"),
            bodyContent,
        }),
        css,
        seo,
    };
}
function buildJsxExportArtifact(tree, siteName, options) {
    var _a, _b, _c, _d;
    const bodyContent = renderJsxBody(tree, options);
    const theme = (_a = tree.theme) !== null && _a !== void 0 ? _a : tree.globalTheme;
    const seo = (0, exportDocument_1.getExportSeoModel)(siteName, tree.seo);
    const metadataModel = (0, exportDocument_1.getExportJsxMetadataModel)(seo);
    const scaffold = (0, exportNextScaffold_1.buildNextExportScaffold)(siteName, seo.title, seo.description);
    return {
        pageTsx: (0, exportTemplates_1.buildNextPageTsx)({
            metadata: {
                title: escapeJsx(metadataModel.title),
                description: metadataModel.description ? escapeJsx(metadataModel.description) : undefined,
                keywords: metadataModel.keywords ? escapeJsx(metadataModel.keywords) : undefined,
                openGraph: {
                    title: escapeJsx(metadataModel.openGraph.title),
                    description: metadataModel.openGraph.description ? escapeJsx(metadataModel.openGraph.description) : undefined,
                    images: ((_c = (_b = metadataModel.openGraph.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url)
                        ? [{ url: escapeJsx(metadataModel.openGraph.images[0].url) }]
                        : undefined,
                    type: "website",
                },
                twitter: {
                    card: "summary_large_image",
                    title: escapeJsx(metadataModel.twitter.title),
                    description: metadataModel.twitter.description ? escapeJsx(metadataModel.twitter.description) : undefined,
                    images: ((_d = metadataModel.twitter.images) === null || _d === void 0 ? void 0 : _d[0])
                        ? [escapeJsx(metadataModel.twitter.images[0])]
                        : undefined,
                },
            },
            bodyContent,
        }),
        layoutTsx: (0, exportTemplates_1.buildNextLayoutTsx)(escapeJsx(siteName)),
        globalsCss: (0, exportCss_1.buildNextExportGlobalsCss)(theme),
        packageJson: scaffold.packageJson,
        nextConfig: scaffold.nextConfig,
        readme: scaffold.readme,
    };
}
