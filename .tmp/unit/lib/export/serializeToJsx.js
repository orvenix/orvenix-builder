"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeTreeToJsx = serializeTreeToJsx;
const exportPipelines_1 = require("../builder-core/compiler/exportPipelines");
function serializeTreeToJsx(tree, siteName, options) {
    return (0, exportPipelines_1.buildJsxExportArtifact)(tree, siteName, options);
}
