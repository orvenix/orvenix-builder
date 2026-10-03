export const MAX_SIZE_BYTES = 5 * 1024 * 1024

export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

/**
 * SEC-1 (SEC0-04): the stored type is decided by the FILE BYTES, never by the
 * client filename or the client-declared MIME. Each verified raster format
 * maps to a server-chosen extension, so an upload can never become
 * executable main-origin HTML/SVG/JS. SVG and HTML are not accepted.
 */
export type VerifiedImageTypeV1 = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/avif"
  extension: ".jpg" | ".png" | ".webp" | ".gif" | ".avif"
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

function ascii(text: string) {
  return Array.from(text, (char) => char.charCodeAt(0))
}

export function detectImageTypeV1(bytes: Uint8Array): VerifiedImageTypeV1 | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: ".png" }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: ".jpg" }
  if (startsWith(bytes, ascii("GIF87a")) || startsWith(bytes, ascii("GIF89a"))) return { mime: "image/gif", extension: ".gif" }
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return { mime: "image/webp", extension: ".webp" }
  // ISO-BMFF: [size][ftyp][major brand] -- only the AVIF brands.
  if (startsWith(bytes, ascii("ftyp"), 4) && (startsWith(bytes, ascii("avif"), 8) || startsWith(bytes, ascii("avis"), 8))) {
    return { mime: "image/avif", extension: ".avif" }
  }
  return null
}

export type UploadValidationV1 =
  | { ok: true; type: VerifiedImageTypeV1 }
  | { ok: false; reason: "TYPE_NOT_ALLOWED" | "TOO_LARGE" | "EMPTY" | "CONTENT_MISMATCH" }

/** Declared MIME must be on the allowlist AND the bytes must be a verified allowed image. */
export function validateImageUploadV1(input: { declaredType: string; size: number; bytes: Uint8Array }): UploadValidationV1 {
  if (!ALLOWED_TYPES.includes(input.declaredType)) return { ok: false, reason: "TYPE_NOT_ALLOWED" }
  if (input.size > MAX_SIZE_BYTES || input.bytes.length > MAX_SIZE_BYTES) return { ok: false, reason: "TOO_LARGE" }
  if (input.bytes.length === 0) return { ok: false, reason: "EMPTY" }
  const type = detectImageTypeV1(input.bytes)
  if (!type) return { ok: false, reason: "CONTENT_MISMATCH" }
  return { ok: true, type }
}
