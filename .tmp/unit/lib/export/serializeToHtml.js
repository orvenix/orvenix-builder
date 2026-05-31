"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeTreeToHtml = serializeTreeToHtml;
const exportPipelines_1 = require("../builder-core/compiler/exportPipelines");
function serializeTreeToHtml(tree, siteName, options) {
    return (0, exportPipelines_1.buildHtmlExportArtifact)(tree, siteName, options);
}
