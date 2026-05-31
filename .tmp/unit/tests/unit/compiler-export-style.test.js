"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportStyle_1 = require("../../lib/builder-core/compiler/exportStyle");
(0, node_test_1.default)("compiler export style builds a normalized style model", () => {
    const props = {
        styleBackground: "#111827",
        styleOpacity: 80,
        stylePadding: 24,
        styleRadius: 18,
        styleBorderWidth: 2,
        styleBorderColor: "#0ea5e9",
        positionMode: "free",
        x: 12,
        y: 24,
        width: 360,
        height: 180,
        customCss: "transform:scale(1.02)",
    };
    const model = (0, exportStyle_1.buildExportStyleModel)(props);
    strict_1.default.equal(model.background, "#111827");
    strict_1.default.equal(model.opacity, 0.8);
    strict_1.default.equal(model.padding, 24);
    strict_1.default.equal(model.borderRadius, 18);
    strict_1.default.equal(model.border, "2px solid #0ea5e9");
    strict_1.default.equal(model.position, "absolute");
    strict_1.default.equal(model.left, 12);
    strict_1.default.equal(model.width, 360);
    strict_1.default.equal(model.customCss, "transform:scale(1.02)");
});
(0, node_test_1.default)("compiler export style builds html style attr", () => {
    const props = {
        styleBackground: "#111827",
        stylePadding: 16,
        positionMode: "free",
        x: 10,
        y: 20,
    };
    const attr = (0, exportStyle_1.buildHtmlStyleAttr)(props, String);
    strict_1.default.match(attr, /style="/);
    strict_1.default.match(attr, /background:#111827/);
    strict_1.default.match(attr, /padding:16px/);
    strict_1.default.match(attr, /position:absolute/);
    strict_1.default.match(attr, /left:10px/);
    strict_1.default.match(attr, /top:20px/);
});
(0, node_test_1.default)("compiler export style builds jsx style expression", () => {
    const props = {
        styleBackground: "#111827",
        styleRadius: 12,
        styleBorderWidth: 1,
        styleBorderColor: "#e2e8f0",
        width: 320,
        height: 120,
        positionMode: "free",
    };
    const expr = (0, exportStyle_1.buildJsxStyleExpr)(props);
    strict_1.default.match(expr, /style=\{\{/);
    strict_1.default.match(expr, /background: "#111827"/);
    strict_1.default.match(expr, /borderRadius: 12/);
    strict_1.default.match(expr, /border: "1px solid #e2e8f0"/);
    strict_1.default.match(expr, /position: "absolute"/);
    strict_1.default.match(expr, /width: 320/);
    strict_1.default.match(expr, /height: 120/);
});
