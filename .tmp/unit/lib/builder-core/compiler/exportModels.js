"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportLayoutModel = getExportLayoutModel;
exports.getExportHeadingModel = getExportHeadingModel;
exports.getExportTextModel = getExportTextModel;
exports.getExportButtonModel = getExportButtonModel;
exports.getExportImageModel = getExportImageModel;
exports.getExportPlaceholderModel = getExportPlaceholderModel;
const exportNodes_1 = require("./exportNodes");
function getExportLayoutModel(node) {
    const props = node.props;
    return {
        tag: node.type === "section" ? "section" : "div",
        maxWidth: typeof props.maxWidth === "string" && props.maxWidth.trim() ? props.maxWidth : null,
    };
}
function getExportHeadingModel(node) {
    var _a, _b;
    const props = node.props;
    const level = Number((_a = props.level) !== null && _a !== void 0 ? _a : 2);
    return {
        tag: `h${Math.min(Math.max(level, 1), 6)}`,
        text: String((_b = props.text) !== null && _b !== void 0 ? _b : ""),
        alignClass: typeof props.align === "string" && props.align.trim() ? `text-${props.align}` : null,
    };
}
function getExportTextModel(node) {
    var _a;
    const props = node.props;
    return {
        content: String((_a = props.content) !== null && _a !== void 0 ? _a : ""),
        alignClass: typeof props.align === "string" && props.align.trim() ? `text-${props.align}` : null,
    };
}
function getExportButtonModel(node, siteId) {
    var _a;
    const props = node.props;
    const href = (0, exportNodes_1.resolveExportHref)(siteId !== null && siteId !== void 0 ? siteId : null, props.href);
    return {
        href,
        label: String((_a = props.label) !== null && _a !== void 0 ? _a : ""),
        isExternal: href.startsWith("http"),
        className: props.variant === "secondary" ? "cta-button cta-button--secondary" : "cta-button",
    };
}
function getExportImageModel(node) {
    var _a, _b;
    const props = node.props;
    const caption = typeof props.caption === "string" && props.caption.trim()
        ? props.caption
        : typeof props.title === "string" && props.title.trim()
            ? props.title
            : "";
    return {
        src: String((_a = props.src) !== null && _a !== void 0 ? _a : ""),
        alt: String((_b = props.alt) !== null && _b !== void 0 ? _b : ""),
        width: typeof props.width === "number" ? props.width : null,
        height: typeof props.height === "number" ? props.height : null,
        objectFitCover: props.objectFit === "cover",
        caption,
    };
}
function getExportPlaceholderModel(node) {
    var _a;
    const slug = node.type.replace(/[^a-z0-9-]/g, "-");
    return {
        label: (_a = node.displayName) !== null && _a !== void 0 ? _a : node.type,
        slug,
        className: `orv-block orv-block--${slug}`,
        meta: (0, exportNodes_1.getComplexBlockMeta)(node.type),
    };
}
