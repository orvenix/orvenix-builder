"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const html_1 = require("../../lib/builder-core/compiler/html");
const theme = {
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
        easing: "ease",
    },
};
function createNode(overrides) {
    var _a, _b, _c, _d, _e;
    return Object.assign(Object.assign({ id: (_a = overrides.id) !== null && _a !== void 0 ? _a : "node", type: (_b = overrides.type) !== null && _b !== void 0 ? _b : "text", props: (_c = overrides.props) !== null && _c !== void 0 ? _c : {}, children: (_d = overrides.children) !== null && _d !== void 0 ? _d : [], version: (_e = overrides.version) !== null && _e !== void 0 ? _e : 1 }, (overrides.parentId ? { parentId: overrides.parentId } : {})), (overrides.hidden ? { hidden: overrides.hidden } : {}));
}
(0, node_test_1.default)("compiler html escapes unsafe text safely", () => {
    strict_1.default.equal((0, html_1.escapeHtml)(`Tom & Jerry <script>"x"</script>`), "Tom &amp; Jerry &lt;script&gt;&quot;x&quot;&lt;/script&gt;");
});
(0, node_test_1.default)("compiler html resolves semantic tags and styles", () => {
    const heading = createNode({
        type: "heading",
        props: { level: 3, size: "4xl", weight: "extrabold", text: "Hola" },
    });
    strict_1.default.equal((0, html_1.getHtmlTag)(heading), "h3");
    strict_1.default.match((0, html_1.getNodeStyle)(heading, theme), /font-size:3.75rem;/);
    strict_1.default.match((0, html_1.getNodeStyle)(heading, theme), /font-weight:800;/);
});
(0, node_test_1.default)("compiler html builds safe attributes for links and images", () => {
    const cta = createNode({
        type: "ctaButton",
        props: { href: "contacto", label: "Escribir" },
    });
    const image = createNode({
        type: "image",
        props: { src: "img/hero.png", alt: "Hero" },
    });
    strict_1.default.match((0, html_1.getNodeAttributes)(cta, theme), /href="\/contacto"/);
    strict_1.default.match((0, html_1.getNodeAttributes)(image, theme), /src="\/img\/hero\.png"/);
    strict_1.default.match((0, html_1.getNodeAttributes)(image, theme), /loading="lazy"/);
});
(0, node_test_1.default)("compiler html renders nested nodes into semantic html", () => {
    const tree = {
        rootId: "root",
        nodes: {
            root: createNode({
                id: "root",
                type: "section",
                props: { maxWidth: "lg", paddingX: "md" },
                children: ["title", "copy"],
            }),
            title: createNode({
                id: "title",
                type: "heading",
                props: { level: 1, text: "Impulsa tu operación" },
                parentId: "root",
            }),
            copy: createNode({
                id: "copy",
                type: "text",
                props: { content: "Automatiza ventas\nsin fricción" },
                parentId: "root",
            }),
        },
    };
    const html = (0, html_1.renderNodeToHtml)(tree.nodes.root, tree, theme);
    strict_1.default.match(html, /<section/);
    strict_1.default.match(html, /<h1[^>]*>Impulsa tu operación<\/h1>/);
    strict_1.default.match(html, /Automatiza ventas<br>sin fricción/);
});
(0, node_test_1.default)("compiler html builds global document css from theme tokens", () => {
    const css = (0, html_1.buildDocumentCss)(theme);
    strict_1.default.match(css, /--primary:#111827;/);
    strict_1.default.match(css, /--space-sectionX:1.5rem;/);
    strict_1.default.match(css, /--radius-button:999px;/);
    strict_1.default.match(css, /font-family:var\(--font-body\)/);
});
