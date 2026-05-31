"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeDeviceFromWidth = getRuntimeDeviceFromWidth;
exports.getRuntimeThemeStyleVars = getRuntimeThemeStyleVars;
exports.getRuntimePreviewMinHeight = getRuntimePreviewMinHeight;
exports.getRuntimeFreePositionStyle = getRuntimeFreePositionStyle;
function getRuntimeDeviceFromWidth(width) {
    if (width <= 640)
        return "mobile";
    if (width <= 1024)
        return "tablet";
    return "desktop";
}
function getRuntimeThemeStyleVars(theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (!theme) {
        return {};
    }
    return {
        "--primary": (_a = theme.colors) === null || _a === void 0 ? void 0 : _a.primary,
        "--secondary": (_b = theme.colors) === null || _b === void 0 ? void 0 : _b.secondary,
        "--background": (_c = theme.colors) === null || _c === void 0 ? void 0 : _c.background,
        "--text": (_d = theme.colors) === null || _d === void 0 ? void 0 : _d.text,
        "--accent": (_e = theme.colors) === null || _e === void 0 ? void 0 : _e.accent,
        "--font-heading": theme.fontHeading,
        "--font-body": theme.fontBody,
        "--space-section-x": (_f = theme.spacing) === null || _f === void 0 ? void 0 : _f.sectionX,
        "--space-section-y": (_g = theme.spacing) === null || _g === void 0 ? void 0 : _g.sectionY,
        "--space-stack": (_h = theme.spacing) === null || _h === void 0 ? void 0 : _h.stack,
        "--radius-card": (_j = theme.radius) === null || _j === void 0 ? void 0 : _j.card,
        "--radius-button": (_k = theme.radius) === null || _k === void 0 ? void 0 : _k.button,
        "--shadow-soft": (_l = theme.shadow) === null || _l === void 0 ? void 0 : _l.soft,
        "--shadow-strong": (_m = theme.shadow) === null || _m === void 0 ? void 0 : _m.strong,
        "--motion-duration": (_o = theme.motion) === null || _o === void 0 ? void 0 : _o.duration,
        "--motion-easing": (_p = theme.motion) === null || _p === void 0 ? void 0 : _p.easing,
    };
}
function getRuntimePreviewMinHeight(tree, device, resolveNodeProps) {
    const freeBottom = Object.values(tree.nodes).reduce((height, node) => {
        const props = resolveNodeProps(node.props, device);
        if (props.positionMode !== "free")
            return height;
        return Math.max(height, toFiniteNumber(props.y, 0) + toFiniteNumber(props.height, 120));
    }, 720);
    return Math.max(720, freeBottom + 48);
}
function getRuntimeFreePositionStyle(props, baseStyle = {}) {
    return Object.assign(Object.assign({}, baseStyle), { position: "absolute", left: toFiniteNumber(props.x, 0), top: toFiniteNumber(props.y, 0), width: toOptionalPixelSize(props.width), height: toOptionalPixelSize(props.height), zIndex: toFiniteNumber(props.zIndex, 1) });
}
function toFiniteNumber(value, fallback) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}
function toOptionalPixelSize(value) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? `${numeric}px` : undefined;
}
