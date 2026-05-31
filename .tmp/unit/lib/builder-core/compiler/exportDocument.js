"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportSeoModel = getExportSeoModel;
exports.getExportHtmlSeoMetaModel = getExportHtmlSeoMetaModel;
exports.getExportJsxMetadataModel = getExportJsxMetadataModel;
const document_1 = require("./document");
function getExportSeoModel(siteName, seo) {
    var _a;
    const normalized = (0, document_1.normalizeDocumentSeo)({
        title: ((_a = seo === null || seo === void 0 ? void 0 : seo.title) === null || _a === void 0 ? void 0 : _a.trim()) || siteName,
        description: seo === null || seo === void 0 ? void 0 : seo.description,
        keywords: seo === null || seo === void 0 ? void 0 : seo.keywords,
        ogImage: seo === null || seo === void 0 ? void 0 : seo.ogImage,
    });
    return Object.assign(Object.assign({}, normalized), { canonicalUrl: typeof (seo === null || seo === void 0 ? void 0 : seo.canonicalUrl) === "string" ? seo.canonicalUrl.trim() : "" });
}
function getExportHtmlSeoMetaModel(seo) {
    return {
        description: seo.description,
        keywords: seo.keywords,
        canonicalUrl: seo.canonicalUrl,
        openGraph: [
            { property: "og:title", content: seo.title },
            { property: "og:type", content: "website" },
            ...(seo.description ? [{ property: "og:description", content: seo.description }] : []),
            ...(seo.ogImage ? [{ property: "og:image", content: seo.ogImage }] : []),
        ],
        twitter: [
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: seo.title },
            ...(seo.description ? [{ name: "twitter:description", content: seo.description }] : []),
            ...(seo.ogImage ? [{ name: "twitter:image", content: seo.ogImage }] : []),
        ],
    };
}
function getExportJsxMetadataModel(seo) {
    return Object.assign(Object.assign(Object.assign({ title: seo.title }, (seo.description ? { description: seo.description } : {})), (seo.keywords ? { keywords: seo.keywords } : {})), { openGraph: Object.assign(Object.assign(Object.assign({ title: seo.title }, (seo.description ? { description: seo.description } : {})), (seo.ogImage ? { images: [{ url: seo.ogImage }] } : {})), { type: "website" }), twitter: Object.assign(Object.assign({ card: "summary_large_image", title: seo.title }, (seo.description ? { description: seo.description } : {})), (seo.ogImage ? { images: [seo.ogImage] } : {})) });
}
