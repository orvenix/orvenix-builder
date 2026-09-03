import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-session"
import { canManageSite, type UserRole } from "@/lib/auth"
import {
  getResolvedSiteRuntimeContext,
  listResolvedSiteRuntimePages,
} from "@/lib/builder-core/tree/siteRuntimeContext"
import { HOME_PAGE_SLUG } from "@/lib/builder-core/tree/sitePages"
import { prepareExportTreeAssets } from "@/lib/export/assets"
import { serializeTreeToHtml } from "@/lib/export/serializeToHtml"
import { serializeTreeToJsx } from "@/lib/export/serializeToJsx"
import { validateHtmlExport } from "@/lib/export/validateHtmlExport"
import { requireExportPlan } from "@/lib/plan-guard"
import type { EditorTree } from "@/types/editor"

type Ctx = { params: Promise<{ id: string }> }

type ZipArchiveCtor = new (options?: { zlib?: { level?: number } }) => {
  on(event: "data", listener: (chunk: Buffer) => void): void
  on(event: "end", listener: () => void): void
  on(event: "error", listener: (error: Error) => void): void
  append(source: string | Buffer, data: { name: string }): void
  finalize(): void
}

type ExportPageEntry = {
  id: string | null
  siteId: string
  slug: string
  name: string
  isHome: boolean
  published: boolean
  source: "site-page" | "legacy-site-tree"
  tree: EditorTree
}

const MAX_EXPORT_PAGES = 100;
const MAX_EXPORT_ASSETS = 500;
const MAX_EXPORT_BYTES = 100 * 1024 * 1024;

const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function jsonError(
  error: string,
  status: number,
  code: string,
) {
  return NextResponse.json(
    { error, code },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

function assertSafeSlug(slug: string): string {
  if (slug === HOME_PAGE_SLUG) {
    return slug;
  }

  if (
    !slug ||
    slug.length > 100 ||
    !SAFE_SLUG_PATTERN.test(slug)
  ) {
    throw new Error("UNSAFE_EXPORT_SLUG");
  }

  return slug;
}

function assertSafeZipPath(value: string): string {
  const normalized = value.replaceAll("\\", "/");

  if (
    !normalized ||
    normalized.length > 500 ||
    normalized.startsWith("/") ||
    normalized.includes("\0") ||
    normalized.split("/").some(
      (segment) => segment === ".." || segment === "." || segment === "",
    )
  ) {
    throw new Error("UNSAFE_ZIP_PATH");
  }

  return normalized;
}

/** GET /api/editor/[id]/export?format=static|nextjs */
export async function GET(req: Request, { params }: Ctx) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 })
  }

  const { id } = await params
  const searchParams = new URL(req.url).searchParams;
const page = searchParams.get("page") ?? HOME_PAGE_SLUG;
const requestedFormat = searchParams.get("format") ?? "static";

if (requestedFormat !== "static" && requestedFormat !== "nextjs") {
  return jsonError(
    "Formato de exportación no válido",
    400,
    "INVALID_EXPORT_FORMAT",
  );
}

try {
  assertSafeSlug(page);
} catch {
  return jsonError(
    "Página no válida",
    400,
    "INVALID_PAGE_SLUG",
  );
}

  const allowed = await canManageSite(id, session.user.id, (session.user.role ?? "CLIENT") as UserRole)
  if (!allowed) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  try {
    await requireExportPlan(session.user.id)
  } catch {
  return jsonError(
    "La exportación requiere un plan Pro o superior",
    403,
    "PLAN_REQUIRED",
  );
}

  const format = new URL(req.url).searchParams.get("format") === "nextjs" ? "nextjs" : "static"
  const exportAllPages = new URL(req.url).searchParams.get("all") !== "false"

  const pages = await resolveExportPages(id, page, exportAllPages)
  if (pages.length === 0) {
    return NextResponse.json({ error: "Sitio no encontrado" }, { status: 404 })
  }

if (pages.length === 0) {
  return jsonError(
    "Sitio no encontrado",
    404,
    "SITE_NOT_FOUND",
  );
}

if (pages.length > MAX_EXPORT_PAGES) {
  return jsonError(
    "El sitio contiene demasiadas páginas para exportarlo",
    413,
    "EXPORT_PAGE_LIMIT_EXCEEDED",
  );
}

try {
  for (const pageEntry of pages) {
    assertSafeSlug(pageEntry.slug);
  }
} catch {
  return jsonError(
    "El sitio contiene una ruta de página no válida",
    400,
    "INVALID_PAGE_SLUG",
  );
}

  // Obtener nombre del sitio
  const { editorPrisma } = await import("@/lib/editor-db")
  const site = await editorPrisma.editorWebsite.findUnique({
    where: { id },
    select: { name: true },
  })
  const siteName = site?.name ?? "Mi Sitio"

  // Generar ZIP en memoria
  const chunks: Buffer[] = []
  const { ZipArchive } = await import("archiver") as unknown as { ZipArchive: ZipArchiveCtor }
  const archive = new ZipArchive({ zlib: { level: 6 } })

  let generatedBytes = 0;
let exportTooLarge = false;

archive.on("data", (chunk: Buffer) => {
  generatedBytes += chunk.length;

  if (generatedBytes > MAX_EXPORT_BYTES) {
    exportTooLarge = true;
    return;
  }

  chunks.push(chunk);
});

  const done = new Promise<void>((resolve, reject) => {
    archive.on("end", resolve)
    archive.on("error", reject)
  })

  if (format === "static") {
    // ── Export HTML estático ──────────────────────────────────────────────────
    let rootCss: string | null = null
    const validationReports: Array<{ slug: string; name: string; valid: boolean; errors: number; warnings: number }> = []
    const assetsByPath = new Map<string, Buffer>()

    for (const pageEntry of pages) {
      if (!pageEntry.tree) continue
      const prepared = await prepareExportTreeAssets(pageEntry.tree, format)
      const stylesHref = pageEntry.slug === HOME_PAGE_SLUG ? "styles.css" : "../styles.css"
      const { html, css } = serializeTreeToHtml(prepared.tree, pageEntry.name, {
        siteId: id,
        stylesHref,
        currentPageSlug: pageEntry.slug,
        pages: pages as never,
      })
      const validationReport = validateHtmlExport(html)
      const outputPath = pageEntry.slug === HOME_PAGE_SLUG ? "index.html" : `${pageEntry.slug}/index.html`

      archive.append(html, {
  name: assertSafeZipPath(outputPath),
});
      validationReports.push({
        slug: pageEntry.slug,
        name: pageEntry.name,
        valid: validationReport.valid,
        errors: validationReport.errors,
        warnings: validationReport.warnings,
      })

      if (rootCss === null) {
        rootCss = css
      }

      for (const asset of prepared.assets) {
  const safeAssetPath = assertSafeZipPath(asset.zipPath);

  if (!assetsByPath.has(safeAssetPath)) {
    assetsByPath.set(safeAssetPath, asset.content);
  }

  if (assetsByPath.size > MAX_EXPORT_ASSETS) {
    throw new Error("EXPORT_ASSET_LIMIT_EXCEEDED");
  }
}
    }

    archive.append(rootCss ?? "", { name: "styles.css" })
    archive.append(JSON.stringify(validationReports, null, 2), { name: "w3c-validation-report.json" })
    for (const [zipPath, content] of assetsByPath.entries()) {
      archive.append(content, { name: zipPath })
    }

    archive.append(
      `# ${siteName}\n\nExportado desde Orvenix Builder.\n\nPáginas incluidas: ${pages.length}.\n\n- Home: \`index.html\`\n${pages
        .filter((entry) => entry.slug !== HOME_PAGE_SLUG)
        .map((entry) => `- ${entry.name}: \`${entry.slug}/index.html\``)
        .join("\n")}\n\nSube los archivos a cualquier hosting estático. Revisa \`w3c-validation-report.json\` para el resumen por página.`,
      { name: "README.md" }
    )
  } else {
    // ── Export Next.js ────────────────────────────────────────────────────────
    let layoutTsx: string | null = null
    let globalsCss: string | null = null
    let packageJson: string | null = null
    let nextConfig: string | null = null
    let readme: string | null = null
    const validationReports: Array<{ slug: string; name: string; valid: boolean; errors: number; warnings: number }> = []
    const assetsByPath = new Map<string, Buffer>()

    for (const pageEntry of pages) {
      if (!pageEntry.tree) continue
      const prepared = await prepareExportTreeAssets(pageEntry.tree, format)
      const jsxExport = serializeTreeToJsx(prepared.tree, pageEntry.name, {
        siteId: id,
        currentPageSlug: pageEntry.slug,
        pages: pages as never,
      })
      const { html } = serializeTreeToHtml(prepared.tree, pageEntry.name, {
        siteId: id,
        stylesHref: "./globals.css",
        currentPageSlug: pageEntry.slug,
        pages: pages as never,
      })
      const validationReport = validateHtmlExport(html)

      const pagePath = pageEntry.slug === HOME_PAGE_SLUG ? "app/page.tsx" : `app/${pageEntry.slug}/page.tsx`
      archive.append(jsxExport.pageTsx, {
  name: assertSafeZipPath(pagePath),
});
      validationReports.push({
        slug: pageEntry.slug,
        name: pageEntry.name,
        valid: validationReport.valid,
        errors: validationReport.errors,
        warnings: validationReport.warnings,
      })

      layoutTsx ??= jsxExport.layoutTsx
      globalsCss ??= jsxExport.globalsCss
      packageJson ??= jsxExport.packageJson
      nextConfig ??= jsxExport.nextConfig
      readme ??= jsxExport.readme

      for (const asset of prepared.assets) {
  const safeAssetPath = assertSafeZipPath(asset.zipPath);

  if (!assetsByPath.has(safeAssetPath)) {
    assetsByPath.set(safeAssetPath, asset.content);
  }

  if (assetsByPath.size > MAX_EXPORT_ASSETS) {
    throw new Error("EXPORT_ASSET_LIMIT_EXCEEDED");
  }
}
    }

    archive.append(layoutTsx ?? "",   { name: "app/layout.tsx" })
    archive.append(globalsCss ?? "",  { name: "app/globals.css" })
    archive.append(packageJson ?? "{}", { name: "package.json" })
    archive.append(nextConfig ?? "",  { name: "next.config.ts" })
    archive.append(readme ?? "",      { name: "README.md" })
    archive.append(JSON.stringify(validationReports, null, 2), { name: "w3c-validation-report.json" })
    for (const [zipPath, content] of assetsByPath.entries()) {
      archive.append(content, {
  name: assertSafeZipPath(`public/${zipPath}`),
});
    }
    archive.append(
      `/** @type {import('tailwindcss').Config} */\nmodule.exports = { content: ["./app/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] }`,
      { name: "tailwind.config.js" }
    )
    archive.append(
      `{\n  "compilerOptions": {\n    "target": "ES2017",\n    "lib": ["dom","esnext"],\n    "jsx": "preserve",\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "strict": true,\n    "paths": { "@/*": ["./*"] }\n  }\n}`,
      { name: "tsconfig.json" }
    )
  }

  archive.finalize()
  await done
if (exportTooLarge) {
  return jsonError(
    "La exportación excede el tamaño permitido",
    413,
    "EXPORT_TOO_LARGE",
  );
}

  const buffer = Buffer.concat(chunks)
  const filename = `${siteName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${format}.zip`

  return new NextResponse(buffer, {
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": String(buffer.length),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  },
});
}

async function resolveExportPages(siteId: string, activePageSlug: string, exportAllPages: boolean): Promise<ExportPageEntry[]> {
  if (!exportAllPages) {
    const runtimeContext = await getResolvedSiteRuntimeContext(siteId, activePageSlug)
    return runtimeContext
      ? [{
          id: runtimeContext.page.id,
          siteId,
          slug: runtimeContext.activePageSlug,
          name: runtimeContext.activePageName,
          isHome: runtimeContext.page.isHome,
          published: runtimeContext.page.published,
          source: runtimeContext.page.source,
          tree: runtimeContext.tree,
        }]
      : []
  }

  const pages = await listResolvedSiteRuntimePages(siteId)
  return pages.map((page) => ({
    id: page.page.id,
    siteId,
    slug: page.activePageSlug,
    name: page.activePageName,
    isHome: page.page.isHome,
    published: page.page.published,
    source: page.page.source,
    tree: page.tree,
  }))
}
