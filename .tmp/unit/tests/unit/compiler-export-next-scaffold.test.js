"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const exportNextScaffold_1 = require("../../lib/builder-core/compiler/exportNextScaffold");
(0, node_test_1.default)("compiler export next scaffold builds package json with pinned versions", () => {
    const pkg = JSON.parse((0, exportNextScaffold_1.buildNextExportPackageJson)("Sitio Demo"));
    strict_1.default.equal(pkg.name, "sitio-demo");
    strict_1.default.equal(pkg.dependencies.next, exportNextScaffold_1.EXPORT_NEXT_VERSION);
    strict_1.default.equal(pkg.dependencies.react, exportNextScaffold_1.EXPORT_REACT_VERSION);
    strict_1.default.equal(pkg.dependencies["react-dom"], exportNextScaffold_1.EXPORT_REACT_VERSION);
});
(0, node_test_1.default)("compiler export next scaffold builds config and readme", () => {
    const config = (0, exportNextScaffold_1.buildNextExportConfig)();
    const readme = (0, exportNextScaffold_1.buildNextExportReadme)("Sitio Demo", "Titulo SEO", "Descripcion SEO");
    const scaffold = (0, exportNextScaffold_1.buildNextExportScaffold)("Sitio Demo", "Titulo SEO", "Descripcion SEO");
    strict_1.default.match(config, /remotePatterns/);
    strict_1.default.match(readme, /# Sitio Demo/);
    strict_1.default.match(readme, /\*\*Título:\*\* Titulo SEO/);
    strict_1.default.equal(scaffold.packageJson, (0, exportNextScaffold_1.buildNextExportPackageJson)("Sitio Demo"));
    strict_1.default.equal(scaffold.nextConfig, config);
    strict_1.default.equal(scaffold.readme, readme);
});
