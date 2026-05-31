"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const rendering_1 = require("../../lib/builder-core/runtime/rendering");
(0, node_test_1.default)("runtime rendering helpers resolve device mode from viewport width", () => {
    strict_1.default.equal((0, rendering_1.getRuntimeDeviceFromWidth)(375), "mobile");
    strict_1.default.equal((0, rendering_1.getRuntimeDeviceFromWidth)(900), "tablet");
    strict_1.default.equal((0, rendering_1.getRuntimeDeviceFromWidth)(1440), "desktop");
});
(0, node_test_1.default)("runtime rendering helpers expose theme css variables", () => {
    const theme = {
        colors: {
            primary: "#2563eb",
            secondary: "#0f172a",
            background: "#ffffff",
            text: "#111827",
            accent: "#22c55e",
        },
        fontHeading: "Sora",
        fontBody: "Inter",
        spacing: {
            sectionX: "2rem",
            sectionY: "4rem",
            stack: "1.5rem",
        },
        radius: {
            card: "1rem",
            button: "999px",
        },
        shadow: {
            soft: "0 8px 24px rgba(0,0,0,0.08)",
            strong: "0 24px 60px rgba(0,0,0,0.16)",
        },
        motion: {
            duration: "180ms",
            easing: "ease-out",
        },
    };
    const vars = (0, rendering_1.getRuntimeThemeStyleVars)(theme);
    strict_1.default.equal(vars["--primary"], "#2563eb");
    strict_1.default.equal(vars["--font-heading"], "Sora");
    strict_1.default.equal(vars["--space-section-y"], "4rem");
    strict_1.default.equal(vars["--motion-easing"], "ease-out");
});
(0, node_test_1.default)("runtime rendering helpers compute preview min-height using resolved free nodes", () => {
    const tree = {
        rootId: "root",
        nodes: {
            root: {
                id: "root",
                type: "section",
                props: {},
                children: ["free", "flow"],
                version: 1,
            },
            free: {
                id: "free",
                type: "genericWrapper",
                props: {
                    positionMode: "free",
                    y: 700,
                    height: 200,
                },
                children: [],
                version: 1,
                parentId: "root",
            },
            flow: {
                id: "flow",
                type: "text",
                props: {
                    content: "Hola",
                },
                children: [],
                version: 1,
                parentId: "root",
            },
        },
    };
    const passthrough = (props, _device) => props !== null && props !== void 0 ? props : {};
    strict_1.default.equal((0, rendering_1.getRuntimePreviewMinHeight)(tree, "desktop", passthrough), 948);
});
(0, node_test_1.default)("runtime rendering helpers build free-position style with pixel sizes", () => {
    const style = (0, rendering_1.getRuntimeFreePositionStyle)({
        x: 18,
        y: 42,
        width: 320,
        height: 180,
        zIndex: 3,
    }, { opacity: 0.8 });
    strict_1.default.equal(style.position, "absolute");
    strict_1.default.equal(style.left, 18);
    strict_1.default.equal(style.top, 42);
    strict_1.default.equal(style.width, "320px");
    strict_1.default.equal(style.height, "180px");
    strict_1.default.equal(style.zIndex, 3);
    strict_1.default.equal(style.opacity, 0.8);
});
