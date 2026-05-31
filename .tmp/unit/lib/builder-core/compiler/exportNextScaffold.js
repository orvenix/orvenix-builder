"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORT_REACT_VERSION = exports.EXPORT_NEXT_VERSION = void 0;
exports.buildNextExportPackageJson = buildNextExportPackageJson;
exports.buildNextExportConfig = buildNextExportConfig;
exports.buildNextExportReadme = buildNextExportReadme;
exports.buildNextExportScaffold = buildNextExportScaffold;
exports.EXPORT_NEXT_VERSION = "16.2.4";
exports.EXPORT_REACT_VERSION = "19.2.4";
function buildNextExportPackageJson(siteName) {
    return JSON.stringify({
        name: siteName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: {
            next: exports.EXPORT_NEXT_VERSION,
            react: exports.EXPORT_REACT_VERSION,
            "react-dom": exports.EXPORT_REACT_VERSION,
        },
        devDependencies: {
            typescript: "^5",
            "@types/react": "^19",
            "@types/node": "^20",
            tailwindcss: "^4",
            "@tailwindcss/postcss": "^4",
        },
    }, null, 2);
}
function buildNextExportConfig() {
    return `import type { NextConfig } from "next";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default config;
`;
}
function buildNextExportReadme(siteName, seoTitle, seoDescription) {
    return `# ${siteName}

> Exportado desde [Orvenix Builder](https://orvenix.com.mx) · ${new Date().toISOString().slice(0, 10)}

## Inicio rápido (Next.js)

\`\`\`bash
npm install
npm run dev   # http://localhost:3000
\`\`\`

## Deploy en Vercel (1-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/next.js/tree/canary/examples/hello-world)

1. Sube este directorio a un repo GitHub
2. Importa en vercel.com → **New Project**
3. Framework: **Next.js** (auto-detectado)
4. Haz clic en **Deploy**

## Deploy en cualquier servidor Node.js

\`\`\`bash
npm run build
npm run start   # puerto 3000
\`\`\`

## Validación HTML (W3C)

Tras publicar, valida el HTML en:
👉 https://validator.w3.org/nu/?doc=TU_URL

Para validar el export estático si tienes el ZIP:
👉 https://validator.w3.org/nu/

## SEO actual

- **Título:** ${seoTitle}
- **Descripción:** ${seoDescription || "(sin descripción)"}

---

Generado por [Orvenix Builder](https://orvenix.com.mx) — ${new Date().getFullYear()}

*Exportado el ${new Date().toLocaleDateString("es-MX")} con Orvenix Builder.*
`;
}
function buildNextExportScaffold(siteName, seoTitle, seoDescription) {
    return {
        packageJson: buildNextExportPackageJson(siteName),
        nextConfig: buildNextExportConfig(),
        readme: buildNextExportReadme(siteName, seoTitle, seoDescription),
    };
}
