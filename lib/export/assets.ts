import { readFile } from "fs/promises"
import path from "path"
import type { EditorTree } from "@/types/editor"

export interface ExportAsset {
  zipPath: string
  content: Buffer
}

export interface PreparedExportTree {
  tree: EditorTree
  assets: ExportAsset[]
}

type ExportTarget = "static" | "nextjs"

const ASSET_PROP_KEYS = new Set([
  "src",
  "imageUrl",
  "url",
  "media",
  "ogImage",
  "preview",
  "thumbnail",
])

export async function prepareExportTreeAssets(
  tree: EditorTree,
  target: ExportTarget
): Promise<PreparedExportTree> {
  const clonedTree = JSON.parse(JSON.stringify(tree)) as EditorTree
  const assets: ExportAsset[] = []
  const seen = new Map<string, string>()
  let dataUrlCount = 0

  async function rewriteString(value: string) {
    const prepared = await prepareAsset(value, target, seen, dataUrlCount)
    if (!prepared) return value
    if (prepared.nextDataUrlCount !== undefined) dataUrlCount = prepared.nextDataUrlCount
    if (prepared.asset) assets.push(prepared.asset)
    return prepared.publicPath
  }

  async function rewriteValue(value: unknown, key?: string): Promise<unknown> {
    if (typeof value === "string") {
      return key && ASSET_PROP_KEYS.has(key) ? rewriteString(value) : value
    }

    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => rewriteValue(item, key)))
    }

    if (value && typeof value === "object") {
      const entries = await Promise.all(
        Object.entries(value as Record<string, unknown>).map(async ([childKey, childValue]) => [
          childKey,
          await rewriteValue(childValue, childKey),
        ])
      )
      return Object.fromEntries(entries)
    }

    return value
  }

  for (const node of Object.values(clonedTree.nodes)) {
    node.props = await rewriteValue(node.props) as typeof node.props
  }

  if (clonedTree.seo?.ogImage) {
    clonedTree.seo.ogImage = await rewriteString(clonedTree.seo.ogImage)
  }

  return { tree: clonedTree, assets }
}

async function prepareAsset(
  value: string,
  target: ExportTarget,
  seen: Map<string, string>,
  dataUrlCount: number
): Promise<{ publicPath: string; asset?: ExportAsset; nextDataUrlCount?: number } | null> {
  if (value.startsWith("data:image/")) {
    const parsed = parseDataUrl(value)
    if (!parsed) return null
    const nextCount = dataUrlCount + 1
    const filename = `inline-${nextCount}.${parsed.ext}`
    const zipPath = `assets/${filename}`
    return {
      publicPath: toPublicAssetPath(zipPath, target),
      asset: { zipPath, content: parsed.buffer },
      nextDataUrlCount: nextCount,
    }
  }

  if (!isLocalPublicAsset(value)) return null

  const publicPathname = decodeURIComponent(value.split(/[?#]/)[0] ?? "")
  const sourcePath = path.join(process.cwd(), "public", publicPathname.replace(/^\/+/, ""))
  const resolvedPublic = path.join(process.cwd(), "public")
  const resolvedSource = path.resolve(sourcePath)
  if (!resolvedSource.startsWith(path.resolve(resolvedPublic))) return null

  const existingZipPath = seen.get(resolvedSource)
  if (existingZipPath) {
    return { publicPath: toPublicAssetPath(existingZipPath, target) }
  }

  try {
    const content = await readFile(resolvedSource)
    const filename = uniqueFilename(path.basename(publicPathname), seen)
    const zipPath = `assets/${filename}`
    seen.set(resolvedSource, zipPath)
    return {
      publicPath: toPublicAssetPath(zipPath, target),
      asset: { zipPath, content },
    }
  } catch {
    return null
  }
}

function isLocalPublicAsset(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return false
  if (value.startsWith("/api/")) return false
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(value.split(/[?#]/)[0] ?? "")
}

function toPublicAssetPath(zipPath: string, target: ExportTarget) {
  return target === "nextjs" ? `/${zipPath}` : zipPath
}

function uniqueFilename(filename: string, seen: Map<string, string>) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-") || "asset"
  const used = new Set([...seen.values()].map((zipPath) => path.basename(zipPath)))
  if (!used.has(safe)) return safe

  const ext = path.extname(safe)
  const base = ext ? safe.slice(0, -ext.length) : safe
  let index = 2
  while (used.has(`${base}-${index}${ext}`)) index += 1
  return `${base}-${index}${ext}`
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const ext = normalizeImageExtension(match[1])
  const buffer = Buffer.from(match[2], "base64")
  return { ext, buffer }
}

function normalizeImageExtension(mimeSubtype: string) {
  if (mimeSubtype === "jpeg") return "jpg"
  if (mimeSubtype === "svg+xml") return "svg"
  return mimeSubtype.replace(/[^a-zA-Z0-9]/g, "") || "png"
}
