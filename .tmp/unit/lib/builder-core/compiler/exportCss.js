"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStaticExportCss = buildStaticExportCss;
exports.buildNextExportGlobalsCss = buildNextExportGlobalsCss;
function buildThemeVars(theme) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    if (!theme) {
        return "";
    }
    const colors = (_a = theme.colors) !== null && _a !== void 0 ? _a : {};
    const spacing = (_b = theme.spacing) !== null && _b !== void 0 ? _b : {};
    const radius = (_c = theme.radius) !== null && _c !== void 0 ? _c : {};
    const shadow = (_d = theme.shadow) !== null && _d !== void 0 ? _d : {};
    const motion = (_e = theme.motion) !== null && _e !== void 0 ? _e : {};
    return `  --primary:    ${(_f = colors.primary) !== null && _f !== void 0 ? _f : "#6366f1"};
  --secondary:  ${(_g = colors.secondary) !== null && _g !== void 0 ? _g : "#8b5cf6"};
  --background: ${(_h = colors.background) !== null && _h !== void 0 ? _h : "#ffffff"};
  --text:       ${(_j = colors.text) !== null && _j !== void 0 ? _j : "#1e293b"};
  --accent:     ${(_k = colors.accent) !== null && _k !== void 0 ? _k : "#22c55e"};
  --space-section-x: ${(_l = spacing.sectionX) !== null && _l !== void 0 ? _l : "1.5rem"};
  --space-section-y: ${(_m = spacing.sectionY) !== null && _m !== void 0 ? _m : "3rem"};
  --space-stack: ${(_o = spacing.stack) !== null && _o !== void 0 ? _o : "1.5rem"};
  --radius-card: ${(_p = radius.card) !== null && _p !== void 0 ? _p : "1rem"};
  --radius-button: ${(_q = radius.button) !== null && _q !== void 0 ? _q : "999px"};
  --shadow-soft: ${(_r = shadow.soft) !== null && _r !== void 0 ? _r : "0 12px 32px rgba(15,23,42,0.08)"};
  --shadow-strong: ${(_s = shadow.strong) !== null && _s !== void 0 ? _s : "0 24px 60px rgba(15,23,42,0.18)"};
  --motion-duration: ${(_t = motion.duration) !== null && _t !== void 0 ? _t : "240ms"};
  --motion-easing: ${(_u = motion.easing) !== null && _u !== void 0 ? _u : "cubic-bezier(0.22, 1, 0.36, 1)"};
  --font-heading: ${JSON.stringify((_v = theme.fontHeading) !== null && _v !== void 0 ? _v : "system-ui, sans-serif")};
  --font-body:    ${JSON.stringify((_w = theme.fontBody) !== null && _w !== void 0 ? _w : "system-ui, sans-serif")};`;
}
function buildSharedBaseCss() {
    return `body {
  margin: 0;
  font-family: var(--font-body, system-ui, -apple-system, sans-serif);
  background: var(--background, #ffffff);
  color: var(--text, #1e293b);
  line-height: 1.6;
}
h1,h2,h3,h4,h5,h6 {
  font-family: var(--font-heading, system-ui, -apple-system, sans-serif);
  color: var(--text, #1e293b);
}
img {
  max-width: 100%;
  display: block;
}
.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .85rem 1.2rem;
  border-radius: var(--radius-button, 999px);
  background: var(--primary, #6366f1);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  box-shadow: var(--shadow-soft, 0 12px 32px rgba(15,23,42,0.08));
  transition: opacity var(--motion-duration, 240ms), transform var(--motion-duration, 240ms);
}
.cta-button--secondary {
  background: transparent;
  color: var(--primary, #6366f1);
  border: 2px solid var(--primary, #6366f1);
}
.orv-block {
  border: 1px dashed rgba(15, 23, 42, 0.14);
  border-radius: var(--radius-card, 1rem);
  padding: 1rem;
  margin: 1rem 0;
  background: rgba(255,255,255,.85);
}
.orv-block__inner {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}
.orv-block__icon { font-size: 1.2rem; }
.orv-block__label {
  font-weight: 700;
  color: var(--text, #1e293b);
}
.orv-block__description {
  color: color-mix(in srgb, var(--text, #1e293b) 72%, white);
  font-size: .95rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
.site-nav { width: 100%; }
.site-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}
.site-nav--column ul {
  flex-direction: column;
  align-items: flex-start;
}
.site-nav--center ul { justify-content: center; }
.site-nav--end ul { justify-content: flex-end; }
.site-nav a {
  text-decoration: none;
  transition: color .18s ease, border-color .18s ease, background .18s ease;
}
.site-nav--pill a {
  display: inline-flex;
  align-items: center;
  padding: .65rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255,255,255,0.86);
  color: var(--text, #1e293b);
}
.site-nav--pill a[aria-current="page"] {
  background: color-mix(in srgb, var(--primary, #6366f1) 14%, white);
  border-color: color-mix(in srgb, var(--primary, #6366f1) 35%, white);
  color: var(--primary, #6366f1);
}
.site-nav--minimal a {
  color: color-mix(in srgb, var(--text, #1e293b) 72%, white);
  padding-bottom: .2rem;
  border-bottom: 1px solid transparent;
}
.site-nav--minimal a[aria-current="page"] {
  color: var(--primary, #6366f1);
  border-color: color-mix(in srgb, var(--primary, #6366f1) 32%, white);
}`;
}
function buildStaticExportCss(theme) {
    const vars = buildThemeVars(theme);
    return `/* Generated by Orvenix Builder — orvenix.com.mx */
*, *::before, *::after { box-sizing: border-box; }
${vars ? `body {${vars}
}` : ""}
${buildSharedBaseCss()}`;
}
function buildNextExportGlobalsCss(theme) {
    const vars = buildThemeVars(theme);
    return `/* Generated by Orvenix Builder */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
${vars}
}

${buildSharedBaseCss()}`;
}
