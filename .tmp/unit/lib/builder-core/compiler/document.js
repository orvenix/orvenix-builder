"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DOCUMENT_SEO = exports.DEFAULT_DOCUMENT_THEME = void 0;
exports.normalizeDocumentSeo = normalizeDocumentSeo;
exports.tokenToSpacing = tokenToSpacing;
exports.tokenToMaxWidth = tokenToMaxWidth;
exports.tokenToFontSize = tokenToFontSize;
exports.tokenToFontWeight = tokenToFontWeight;
exports.tokenToRadius = tokenToRadius;
exports.tokenToShadow = tokenToShadow;
exports.normalizePublishedUrl = normalizePublishedUrl;
exports.DEFAULT_DOCUMENT_THEME = {
    colors: {
        primary: "#111827",
        secondary: "#4f46e5",
        background: "#ffffff",
        text: "#1f2937",
        accent: "#06b6d4",
    },
    fontHeading: "Inter, sans-serif",
    fontBody: "Inter, sans-serif",
    spacing: {
        sectionX: "1.5rem",
        sectionY: "3rem",
        stack: "1.5rem",
    },
    radius: {
        card: "1rem",
        button: "999px",
    },
    shadow: {
        soft: "0 12px 32px rgba(15,23,42,0.08)",
        strong: "0 24px 60px rgba(15,23,42,0.18)",
    },
    motion: {
        duration: "240ms",
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
};
exports.DEFAULT_DOCUMENT_SEO = {
    title: "Mi Sitio Web Orvenix",
    description: "Un sitio web creado con Orvenix.",
    keywords: "",
    ogImage: "",
};
function normalizeDocumentSeo(seo) {
    var _a, _b, _c, _d;
    return {
        title: ((_a = seo === null || seo === void 0 ? void 0 : seo.title) === null || _a === void 0 ? void 0 : _a.trim()) || exports.DEFAULT_DOCUMENT_SEO.title,
        description: ((_b = seo === null || seo === void 0 ? void 0 : seo.description) === null || _b === void 0 ? void 0 : _b.trim()) || exports.DEFAULT_DOCUMENT_SEO.description,
        keywords: ((_c = seo === null || seo === void 0 ? void 0 : seo.keywords) === null || _c === void 0 ? void 0 : _c.trim()) || exports.DEFAULT_DOCUMENT_SEO.keywords,
        ogImage: ((_d = seo === null || seo === void 0 ? void 0 : seo.ogImage) === null || _d === void 0 ? void 0 : _d.trim()) || exports.DEFAULT_DOCUMENT_SEO.ogImage,
    };
}
function tokenToSpacing(token) {
    switch (token) {
        case "none":
            return "0";
        case "sm":
            return "0.75rem";
        case "md":
            return "1.5rem";
        case "lg":
            return "3rem";
        case "xl":
            return "5rem";
        default:
            return null;
    }
}
function tokenToMaxWidth(token) {
    switch (token) {
        case "sm":
            return "42rem";
        case "md":
            return "56rem";
        case "lg":
            return "72rem";
        case "xl":
            return "80rem";
        case "full":
            return "100%";
        default:
            return null;
    }
}
function tokenToFontSize(token, type) {
    var _a;
    const map = {
        sm: "0.95rem",
        md: type === "text" ? "1rem" : "1.25rem",
        lg: type === "text" ? "1.125rem" : "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        "3xl": "3rem",
        "4xl": "3.75rem",
        "5xl": "4.5rem",
    };
    return typeof token === "string" ? (_a = map[token]) !== null && _a !== void 0 ? _a : null : null;
}
function tokenToFontWeight(token) {
    switch (token) {
        case "normal":
            return "400";
        case "medium":
            return "500";
        case "semibold":
            return "600";
        case "bold":
            return "700";
        case "extrabold":
            return "800";
        default:
            return null;
    }
}
function tokenToRadius(token) {
    switch (token) {
        case "none":
            return "0";
        case "sm":
            return "0.5rem";
        case "md":
            return "0.85rem";
        case "lg":
            return "1.25rem";
        case "xl":
            return "1.75rem";
        default:
            return null;
    }
}
function tokenToShadow(token) {
    switch (token) {
        case "sm":
            return "0 8px 20px rgba(15, 23, 42, 0.08)";
        case "md":
            return "0 16px 40px rgba(15, 23, 42, 0.12)";
        case "lg":
            return "0 28px 60px rgba(15, 23, 42, 0.16)";
        case "xl":
            return "0 36px 80px rgba(15, 23, 42, 0.2)";
        default:
            return null;
    }
}
function normalizePublishedUrl(value) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw)
        return "";
    if (raw.startsWith("/") ||
        raw.startsWith("#") ||
        raw.startsWith("data:") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) {
        return raw;
    }
    return `/${raw.replace(/^\.?\//, "")}`;
}
