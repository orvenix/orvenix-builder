/**
 * VE-3: the ONE way editor UI uploads an image. It goes through the hardened
 * server route (/api/editor/upload: auth, rate limit, raster allowlist,
 * magic-byte check, size limit, server-chosen filename, metadata stripping)
 * and returns its /uploads URL. Nothing is embedded as base64 in the tree.
 *
 * Draft sites (dev review fixtures, unsaved drafts) never upload: there is no
 * site to attach the file to, and review environments must not write files.
 */

export type EditorUploadResultV1 = { ok: true; url: string } | { ok: false; error: string }

export const DRAFT_UPLOAD_MESSAGE = "Guarda tu sitio para poder subir imágenes."

export function canUploadForWebsite(websiteId: string | null | undefined): boolean {
  return Boolean(websiteId) && !String(websiteId).startsWith("draft:")
}

export async function uploadEditorImageV1(file: File, websiteId: string | null | undefined): Promise<EditorUploadResultV1> {
  if (!canUploadForWebsite(websiteId)) return { ok: false, error: DRAFT_UPLOAD_MESSAGE }
  if (!file.type.startsWith("image/")) return { ok: false, error: "Elige una imagen JPG, PNG o WebP." }
  const body = new FormData()
  body.append("file", file)
  try {
    const response = await fetch("/api/editor/upload", { method: "POST", body })
    const payload = (await response.json().catch(() => ({}))) as { url?: unknown; error?: unknown }
    if (!response.ok || typeof payload.url !== "string" || !/^\/uploads\/[A-Za-z0-9._-]+$/.test(payload.url)) {
      return { ok: false, error: typeof payload.error === "string" ? payload.error : "No se pudo subir la imagen." }
    }
    return { ok: true, url: payload.url }
  } catch {
    return { ok: false, error: "No se pudo subir la imagen. Revisa tu conexión." }
  }
}
