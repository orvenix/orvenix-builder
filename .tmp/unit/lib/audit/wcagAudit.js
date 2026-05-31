"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWcagAudit = runWcagAudit;
exports.calcWcagScore = calcWcagScore;
// ─── Contraste de color (WCAG AA: ratio >= 4.5:1 para texto normal) ───────────
function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return [r, g, b];
    }
    if (clean.length === 6) {
        return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
        ];
    }
    return null;
}
function relativeLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2)
        return null;
    const l1 = relativeLuminance(...rgb1);
    const l2 = relativeLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAllNodes(tree) {
    return Object.values(tree.nodes).filter((n) => n.id !== tree.rootId);
}
// ─── Checks WCAG ──────────────────────────────────────────────────────────────
function runWcagAudit(tree) {
    const issues = [];
    const nodes = getAllNodes(tree);
    // ── Imágenes decorativas sin alt vacío ───────────────────────────────────────
    // (imágenes que tienen alt con texto genérico — mejor vacío o descriptivo)
    nodes
        .filter((n) => n.type === "image")
        .forEach((node) => {
        var _a;
        const alt = String((_a = node.props.alt) !== null && _a !== void 0 ? _a : "");
        if (alt.toLowerCase() === "image" || alt.toLowerCase() === "imagen" || alt.toLowerCase() === "foto") {
            issues.push({
                id: `wcag-alt-generic-${node.id}`,
                domain: "wcag",
                severity: "warning",
                title: "Texto alternativo genérico",
                message: `La imagen tiene alt="${alt}". El texto alternativo debe describir el contenido real de la imagen.`,
                nodeId: node.id,
                autoFixable: false,
            });
        }
    });
    // ── Botones CTA sin texto ────────────────────────────────────────────────────
    nodes
        .filter((n) => n.type === "ctaButton")
        .forEach((node) => {
        var _a;
        const label = String((_a = node.props.label) !== null && _a !== void 0 ? _a : "").trim();
        if (label.length === 0) {
            issues.push({
                id: `wcag-btn-no-label-${node.id}`,
                domain: "wcag",
                severity: "error",
                title: "Botón sin texto",
                message: "Los botones deben tener texto visible o aria-label. Un botón vacío es inaccesible para lectores de pantalla.",
                nodeId: node.id,
                autoFixable: true,
                fix: () => ({ label: "Ver más" }),
            });
        }
    });
    // ── Contraste de texto (verificar colores configurados) ──────────────────────
    nodes
        .filter((n) => ["heading", "text"].includes(n.type))
        .forEach((node) => {
        const p = node.props;
        const textColor = typeof p.color === "string" ? p.color : null;
        const bgColor = typeof p.styleBackground === "string" ? p.styleBackground : null;
        if (textColor && bgColor && textColor.startsWith("#") && bgColor.startsWith("#")) {
            const ratio = contrastRatio(textColor, bgColor);
            if (ratio !== null && ratio < 4.5) {
                issues.push({
                    id: `wcag-contrast-${node.id}`,
                    domain: "wcag",
                    severity: "warning",
                    title: "Contraste insuficiente",
                    message: `Ratio de contraste ${ratio.toFixed(1)}:1. WCAG AA requiere mínimo 4.5:1 para texto normal.`,
                    nodeId: node.id,
                    autoFixable: false,
                });
            }
        }
    });
    // ── Títulos sin jerarquía correcta ───────────────────────────────────────────
    const headingLevels = nodes
        .filter((n) => n.type === "heading")
        .map((n) => { var _a; return Number((_a = n.props.level) !== null && _a !== void 0 ? _a : 2); })
        .sort((a, b) => a - b);
    if (headingLevels.length > 0 && headingLevels[0] > 1) {
        const hasH1Elsewhere = headingLevels.includes(1);
        if (!hasH1Elsewhere) {
            issues.push({
                id: "wcag-heading-hierarchy",
                domain: "wcag",
                severity: "info",
                title: "Jerarquía de encabezados incompleta",
                message: `La página empieza con H${headingLevels[0]} en lugar de H1. La estructura de encabezados ayuda a los usuarios de lectores de pantalla a navegar.`,
                autoFixable: false,
            });
        }
    }
    // ── Imágenes sin atributo alt (duplicado del SEO pero en contexto WCAG) ──────
    nodes
        .filter((n) => {
        if (n.type !== "image")
            return false;
        const alt = n.props.alt;
        return alt === undefined || alt === null;
    })
        .forEach((node) => {
        issues.push({
            id: `wcag-img-missing-alt-${node.id}`,
            domain: "wcag",
            severity: "error",
            title: "Imagen sin atributo alt",
            message: "Las imágenes sin alt son inaccesibles para usuarios con discapacidad visual. Usa alt=\"\" para imágenes decorativas.",
            nodeId: node.id,
            autoFixable: true,
            fix: () => ({ alt: "" }),
        });
    });
    return issues;
}
// ─── Score WCAG (0-100) ───────────────────────────────────────────────────────
function calcWcagScore(issues) {
    const wcagIssues = issues.filter((i) => i.domain === "wcag");
    const penalties = wcagIssues.reduce((sum, i) => {
        if (i.severity === "error")
            return sum + 30;
        if (i.severity === "warning")
            return sum + 12;
        return sum + 4;
    }, 0);
    return Math.max(0, 100 - penalties);
}
