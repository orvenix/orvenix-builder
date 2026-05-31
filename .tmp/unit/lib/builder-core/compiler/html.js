"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.escapeHtmlAttribute = escapeHtmlAttribute;
exports.formatRichText = formatRichText;
exports.getHtmlTag = getHtmlTag;
exports.getNodeStyle = getNodeStyle;
exports.getNodeAttributes = getNodeAttributes;
exports.renderNodeToHtml = renderNodeToHtml;
exports.renderSectionNode = renderSectionNode;
exports.buildDocumentCss = buildDocumentCss;
const document_1 = require("./document");
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function escapeHtmlAttribute(value) {
    return escapeHtml(String(value !== null && value !== void 0 ? value : ""));
}
function formatRichText(value) {
    return escapeHtml(String(value !== null && value !== void 0 ? value : "")).replace(/\n/g, "<br>");
}
function readString(value) {
    return typeof value === "string" ? value : null;
}
function readNumber(value) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}
function pushStyle(styles, property, value) {
    if (value === null || value === undefined || value === "")
        return;
    styles.push(`${property}:${value};`);
}
function toCssColor(value) {
    if (typeof value !== "string" || !value.trim())
        return null;
    return value.startsWith("var(--") ? value : value.trim();
}
function widthOrPosition(value) {
    const numeric = readNumber(value);
    return numeric === null ? null : `${numeric}px`;
}
function resolveButtonPadding(size) {
    switch (size) {
        case "sm":
            return "0.7rem 1rem";
        case "lg":
            return "1rem 1.5rem";
        default:
            return "0.85rem 1.2rem";
    }
}
function resolveButtonFontSize(size) {
    switch (size) {
        case "sm":
            return "0.9rem";
        case "lg":
            return "1rem";
        default:
            return "0.95rem";
    }
}
function resolveTextMaxWidth(token) {
    switch (token) {
        case "sm":
            return "28rem";
        case "md":
            return "36rem";
        case "lg":
            return "42rem";
        default:
            return null;
    }
}
function resolveHeadingMarginBottom(token) {
    switch (token) {
        case "none":
            return "0";
        case "sm":
            return "0.5rem";
        case "lg":
            return "2rem";
        default:
            return "1rem";
    }
}
function resolveCustomShadow(token) {
    switch (token) {
        case "soft":
            return "0 12px 24px rgba(15,23,42,0.08)";
        case "medium":
            return "0 18px 36px rgba(15,23,42,0.12)";
        case "strong":
            return "0 26px 60px rgba(15,23,42,0.16)";
        case "glow":
            return "0 0 0 1px rgba(56,189,248,0.15), 0 20px 40px rgba(56,189,248,0.18)";
        default:
            return null;
    }
}
function getSafeTag(tagName) {
    const safeTags = new Set([
        "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "section", "article", "header", "footer", "main", "aside",
        "ul", "ol", "li", "blockquote", "code", "pre",
    ]);
    return safeTags.has(tagName) ? tagName : "div";
}
function getHtmlTag(node) {
    var _a, _b;
    switch (node.type) {
        case "section":
            return "section";
        case "heading": {
            const level = Math.max(1, Math.min(6, (_a = readNumber(node.props.level)) !== null && _a !== void 0 ? _a : 2));
            return `h${level}`;
        }
        case "text":
            return "p";
        case "ctaButton":
            return "a";
        case "genericWrapper":
            return getSafeTag((_b = readString(node.props.originalType)) !== null && _b !== void 0 ? _b : "div");
        default:
            return "div";
    }
}
function getNodeStyle(node, theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const props = node.props;
    const styles = [];
    const align = readString(props.align);
    const color = toCssColor(props.color);
    const background = toCssColor((_a = props.background) !== null && _a !== void 0 ? _a : props.styleBackground);
    const width = readNumber(props.width);
    const height = readNumber(props.height);
    if (node.type === "section") {
        pushStyle(styles, "width", "100%");
        pushStyle(styles, "padding-top", (_b = (0, document_1.tokenToSpacing)(props.paddingY)) !== null && _b !== void 0 ? _b : "1.5rem");
        pushStyle(styles, "padding-bottom", (_c = (0, document_1.tokenToSpacing)(props.paddingY)) !== null && _c !== void 0 ? _c : "1.5rem");
        pushStyle(styles, "padding-left", (0, document_1.tokenToSpacing)(props.paddingX));
        pushStyle(styles, "padding-right", (0, document_1.tokenToSpacing)(props.paddingX));
        pushStyle(styles, "margin-top", (0, document_1.tokenToSpacing)(props.marginY));
        pushStyle(styles, "margin-bottom", (0, document_1.tokenToSpacing)(props.marginY));
        pushStyle(styles, "text-align", align);
        pushStyle(styles, "max-width", (0, document_1.tokenToMaxWidth)(props.maxWidth));
        pushStyle(styles, "margin-left", "auto");
        pushStyle(styles, "margin-right", "auto");
        pushStyle(styles, "background", background);
        pushStyle(styles, "border-radius", (0, document_1.tokenToRadius)(props.borderRadius));
        pushStyle(styles, "box-shadow", (0, document_1.tokenToShadow)(props.shadow));
    }
    if (node.type === "heading") {
        pushStyle(styles, "margin", "0");
        pushStyle(styles, "margin-bottom", resolveHeadingMarginBottom(props.marginBottom));
        pushStyle(styles, "font-family", "var(--font-heading)");
        pushStyle(styles, "font-size", (_d = (0, document_1.tokenToFontSize)(props.size, node.type)) !== null && _d !== void 0 ? _d : "2rem");
        pushStyle(styles, "font-weight", (_e = (0, document_1.tokenToFontWeight)(props.weight)) !== null && _e !== void 0 ? _e : "700");
        pushStyle(styles, "line-height", "1.1");
        pushStyle(styles, "letter-spacing", "-0.03em");
        pushStyle(styles, "text-align", align);
        pushStyle(styles, "color", color !== null && color !== void 0 ? color : (_f = theme.colors) === null || _f === void 0 ? void 0 : _f.primary);
    }
    if (node.type === "text") {
        pushStyle(styles, "margin", "0");
        pushStyle(styles, "font-size", (_g = (0, document_1.tokenToFontSize)(props.size, node.type)) !== null && _g !== void 0 ? _g : "1rem");
        pushStyle(styles, "line-height", "1.75");
        pushStyle(styles, "text-align", align);
        pushStyle(styles, "color", color !== null && color !== void 0 ? color : (_h = theme.colors) === null || _h === void 0 ? void 0 : _h.text);
        pushStyle(styles, "max-width", resolveTextMaxWidth(props.maxWidth));
        if (align === "center") {
            pushStyle(styles, "margin-left", "auto");
            pushStyle(styles, "margin-right", "auto");
        }
        if (align === "right") {
            pushStyle(styles, "margin-left", "auto");
        }
    }
    if (node.type === "ctaButton") {
        const variant = (_j = readString(props.variant)) !== null && _j !== void 0 ? _j : "primary";
        pushStyle(styles, "display", "inline-flex");
        pushStyle(styles, "align-items", "center");
        pushStyle(styles, "justify-content", "center");
        pushStyle(styles, "gap", "0.5rem");
        pushStyle(styles, "text-decoration", "none");
        pushStyle(styles, "font-weight", "700");
        pushStyle(styles, "border-radius", "999px");
        pushStyle(styles, "padding", resolveButtonPadding(props.size));
        pushStyle(styles, "font-size", resolveButtonFontSize(props.size));
        pushStyle(styles, "transition", "transform .2s ease, opacity .2s ease");
        if (variant === "secondary") {
            pushStyle(styles, "background", "#ffffff");
            pushStyle(styles, "color", (_k = theme.colors) === null || _k === void 0 ? void 0 : _k.secondary);
            pushStyle(styles, "border", `1px solid ${(_m = (_l = theme.colors) === null || _l === void 0 ? void 0 : _l.secondary) !== null && _m !== void 0 ? _m : "#4f46e5"}33`);
        }
        else if (variant === "ghost") {
            pushStyle(styles, "background", "transparent");
            pushStyle(styles, "color", (_o = theme.colors) === null || _o === void 0 ? void 0 : _o.secondary);
            pushStyle(styles, "border", `1px solid ${(_q = (_p = theme.colors) === null || _p === void 0 ? void 0 : _p.secondary) !== null && _q !== void 0 ? _q : "#4f46e5"}33`);
        }
        else {
            pushStyle(styles, "background", (_s = (_r = theme.colors) === null || _r === void 0 ? void 0 : _r.secondary) !== null && _s !== void 0 ? _s : "#4f46e5");
            pushStyle(styles, "color", "#ffffff");
            pushStyle(styles, "border", "1px solid transparent");
            pushStyle(styles, "box-shadow", "0 16px 32px rgba(79,70,229,0.18)");
        }
    }
    if (node.type === "image") {
        pushStyle(styles, "display", "block");
        pushStyle(styles, "max-width", width ? `${width}px` : "100%");
        pushStyle(styles, "width", width ? `${width}px` : "100%");
        pushStyle(styles, "height", height ? `${height}px` : "auto");
        pushStyle(styles, "object-fit", (_t = readString(props.objectFit)) !== null && _t !== void 0 ? _t : "cover");
        pushStyle(styles, "border-radius", (_u = (0, document_1.tokenToRadius)(props.borderRadius)) !== null && _u !== void 0 ? _u : "1rem");
    }
    if (node.type === "genericWrapper") {
        pushStyle(styles, "width", width ? `${width}px` : null);
        pushStyle(styles, "height", height ? `${height}px` : null);
    }
    const opacity = readNumber(props.styleOpacity);
    if (opacity !== null)
        pushStyle(styles, "opacity", Math.max(0, Math.min(100, opacity)) / 100);
    pushStyle(styles, "padding", readNumber(props.stylePadding) ? `${readNumber(props.stylePadding)}px` : null);
    pushStyle(styles, "border-radius", readNumber(props.styleRadius) ? `${readNumber(props.styleRadius)}px` : null);
    pushStyle(styles, "border-width", readNumber(props.styleBorderWidth) ? `${readNumber(props.styleBorderWidth)}px` : null);
    pushStyle(styles, "border-style", readNumber(props.styleBorderWidth) ? "solid" : null);
    pushStyle(styles, "border-color", toCssColor(props.styleBorderColor));
    pushStyle(styles, "background", background);
    pushStyle(styles, "box-shadow", resolveCustomShadow(props.styleShadow));
    if (props.positionMode === "free") {
        pushStyle(styles, "position", "absolute");
        pushStyle(styles, "left", widthOrPosition(props.x));
        pushStyle(styles, "top", widthOrPosition(props.y));
        pushStyle(styles, "width", widthOrPosition(props.width));
        pushStyle(styles, "height", widthOrPosition(props.height));
        pushStyle(styles, "z-index", readNumber(props.zIndex));
    }
    return styles.join("");
}
function getNodeAttributes(node, theme) {
    var _a, _b, _c;
    const attrs = [];
    const style = getNodeStyle(node, theme);
    if (style)
        attrs.push(`style="${escapeHtmlAttribute(style)}"`);
    if (node.type === "ctaButton") {
        const href = (0, document_1.normalizePublishedUrl)((_a = readString(node.props.href)) !== null && _a !== void 0 ? _a : "#");
        attrs.push(`href="${escapeHtmlAttribute(href)}"`);
    }
    if (node.type === "image") {
        const src = (0, document_1.normalizePublishedUrl)((_b = readString(node.props.src)) !== null && _b !== void 0 ? _b : "");
        attrs.push(`src="${escapeHtmlAttribute(src)}"`);
        attrs.push(`alt="${escapeHtmlAttribute((_c = readString(node.props.alt)) !== null && _c !== void 0 ? _c : "")}"`);
        attrs.push(`loading="lazy"`);
        attrs.push(`decoding="async"`);
    }
    if (node.type === "genericWrapper") {
        const className = readString(node.props.className);
        if (className)
            attrs.push(`class="${escapeHtmlAttribute(className)}"`);
        const originalType = readString(node.props.originalType);
        if (originalType)
            attrs.push(`data-original-type="${escapeHtmlAttribute(originalType)}"`);
    }
    return attrs.length ? ` ${attrs.join(" ")}` : "";
}
function renderNodeToHtml(node, tree, theme) {
    var _a;
    if (node.hidden)
        return "";
    if (node.type === "image") {
        return `<img${getNodeAttributes(node, theme)} />`;
    }
    if (node.type === "section") {
        return renderSectionNode(node, tree, theme);
    }
    const tagName = getHtmlTag(node);
    const childrenHtml = node.children
        .map((childId) => {
        const childNode = tree.nodes[childId];
        return childNode ? renderNodeToHtml(childNode, tree, theme) : "";
    })
        .join("");
    let innerHtml = childrenHtml;
    if (!innerHtml) {
        if (node.type === "genericWrapper" && readString(node.props.content)) {
            innerHtml = (_a = readString(node.props.content)) !== null && _a !== void 0 ? _a : "";
        }
        else if (node.props.text)
            innerHtml = formatRichText(node.props.text);
        else if (node.props.content)
            innerHtml = formatRichText(node.props.content);
        else if (node.props.label)
            innerHtml = escapeHtml(String(node.props.label));
    }
    return `<${tagName}${getNodeAttributes(node, theme)}>${innerHtml}</${tagName}>`;
}
function renderSectionNode(node, tree, theme) {
    var _a, _b, _c, _d;
    const tagName = getHtmlTag(node);
    const outerAttributes = getNodeAttributes(node, theme);
    const innerStyles = [];
    pushStyle(innerStyles, "width", "100%");
    pushStyle(innerStyles, "max-width", (_a = (0, document_1.tokenToMaxWidth)(node.props.maxWidth)) !== null && _a !== void 0 ? _a : "72rem");
    pushStyle(innerStyles, "margin-left", "auto");
    pushStyle(innerStyles, "margin-right", "auto");
    pushStyle(innerStyles, "padding-left", (_b = (0, document_1.tokenToSpacing)(node.props.paddingX)) !== null && _b !== void 0 ? _b : "1.5rem");
    pushStyle(innerStyles, "padding-right", (_c = (0, document_1.tokenToSpacing)(node.props.paddingX)) !== null && _c !== void 0 ? _c : "1.5rem");
    pushStyle(innerStyles, "text-align", (_d = readString(node.props.align)) !== null && _d !== void 0 ? _d : "left");
    const childrenHtml = node.children
        .map((childId) => {
        const childNode = tree.nodes[childId];
        return childNode ? renderNodeToHtml(childNode, tree, theme) : "";
    })
        .join("");
    return `<${tagName}${outerAttributes}><div style="${escapeHtmlAttribute(innerStyles.join(""))}">${childrenHtml}</div></${tagName}>`;
}
function buildDocumentCss(theme) {
    var _a, _b, _c, _d, _e;
    const themeCssVars = Object.entries((_a = theme.colors) !== null && _a !== void 0 ? _a : {})
        .map(([key, value]) => `--${key}:${value};`)
        .join("");
    const spacingVars = Object.entries((_b = theme.spacing) !== null && _b !== void 0 ? _b : {})
        .map(([key, value]) => `--space-${key}:${value};`)
        .join("");
    const radiusVars = Object.entries((_c = theme.radius) !== null && _c !== void 0 ? _c : {})
        .map(([key, value]) => `--radius-${key}:${value};`)
        .join("");
    const shadowVars = Object.entries((_d = theme.shadow) !== null && _d !== void 0 ? _d : {})
        .map(([key, value]) => `--shadow-${key}:${value};`)
        .join("");
    const motionVars = Object.entries((_e = theme.motion) !== null && _e !== void 0 ? _e : {})
        .map(([key, value]) => `--motion-${key}:${value};`)
        .join("");
    return `
    :root{${themeCssVars}${spacingVars}${radiusVars}${shadowVars}${motionVars}--font-heading:${theme.fontHeading};--font-body:${theme.fontBody};}
    *{box-sizing:border-box;}
    html{scroll-behavior:smooth;}
    body{
      margin:0;
      font-family:var(--font-body);
      color:var(--text);
      background:var(--background);
      -webkit-font-smoothing:antialiased;
      text-rendering:optimizeLegibility;
    }
    img{max-width:100%;}
    a{color:inherit;}
    main{
      position:relative;
      width:100%;
      overflow-x:hidden;
    }
  `;
}
