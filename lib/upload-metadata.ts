import type { VerifiedImageTypeV1 } from "./upload-policy"

/**
 * VE-3 media hardening: uploaded images are published under /uploads, so the
 * stored bytes must never carry private metadata (EXIF incl. GPS/camera/serial,
 * XMP, IPTC, comments, embedded previews). This is a deterministic, byte-level
 * sanitizer (no re-encode, no new dependency) that KEEPS only what decoding and
 * correct display need (pixel data, colour profile, transparency, animation)
 * and drops every other metadata block. JPEG orientation is preserved through
 * a minimal one-tag EXIF so phone photos still display upright.
 *
 * Anything it cannot parse safely is refused (never stored as-is).
 */

export type MetadataSanitizeResultV1 =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: "MALFORMED" | "UNSTRIPPABLE_METADATA" }

const ascii = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length))

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

/* ------------------------------- JPEG ------------------------------- */

type JpegSegment = { marker: number; start: number; end: number }

function jpegSegments(bytes: Uint8Array): { segments: JpegSegment[]; scanStart: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const segments: JpegSegment[] = []
  let i = 2
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) return null
    while (bytes[i] === 0xff && bytes[i + 1] === 0xff) i += 1
    const marker = bytes[i + 1]
    if (marker === undefined) return null
    if (marker === 0xda || marker === 0xd9) return { segments, scanStart: i }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      segments.push({ marker, start: i, end: i + 2 })
      i += 2
      continue
    }
    if (i + 3 >= bytes.length) return null
    const length = (bytes[i + 2] << 8) | bytes[i + 3]
    if (length < 2 || i + 2 + length > bytes.length) return null
    segments.push({ marker, start: i, end: i + 2 + length })
    i += 2 + length
  }
  return null
}

/** APP0 (JFIF), APP2 ICC_PROFILE and APP14 (Adobe colour transform) are needed for correct decoding; every other APPn/COM is metadata. */
function isKeptJpegSegment(bytes: Uint8Array, segment: JpegSegment): boolean {
  const { marker, start } = segment
  if (marker < 0xe0 || marker > 0xef) return marker !== 0xfe
  if (marker === 0xe0 || marker === 0xee) return true
  if (marker === 0xe2) return ascii(bytes, start + 4, 12) === "ICC_PROFILE\0"
  return false
}

/** Orientation (tag 0x0112) from an APP1 "Exif\0\0" segment, if present and valid. */
function readJpegOrientation(bytes: Uint8Array, segment: JpegSegment): number | undefined {
  const base = segment.start + 4
  if (segment.marker !== 0xe1 || ascii(bytes, base, 6) !== "Exif\0\0") return undefined
  const tiff = base + 6
  const little = ascii(bytes, tiff, 2) === "II"
  if (!little && ascii(bytes, tiff, 2) !== "MM") return undefined
  const u16 = (at: number) => (little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1])
  const u32 = (at: number) => (little ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16)) + bytes[at + 3] * 0x1000000 : bytes[at] * 0x1000000 + ((bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]))
  const ifd = tiff + u32(tiff + 4)
  if (ifd + 2 > segment.end) return undefined
  const count = u16(ifd)
  for (let entry = 0; entry < count; entry += 1) {
    const at = ifd + 2 + entry * 12
    if (at + 12 > segment.end) return undefined
    if (u16(at) === 0x0112 && u16(at + 2) === 3) {
      const value = u16(at + 8)
      return value >= 1 && value <= 8 ? value : undefined
    }
  }
  return undefined
}

/** A minimal APP1 carrying ONLY the orientation tag (no GPS, camera, dates, thumbnails). */
function orientationOnlyApp1(orientation: number): Uint8Array {
  const payload = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF header, IFD0 at 8
    0x00, 0x01, // one entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation SHORT
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]
  const length = payload.length + 2
  return new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff, ...payload])
}

function sanitizeJpeg(bytes: Uint8Array): MetadataSanitizeResultV1 {
  const parsed = jpegSegments(bytes)
  if (!parsed) return { ok: false, reason: "MALFORMED" }
  const orientation = parsed.segments.map((segment) => readJpegOrientation(bytes, segment)).find((value) => value !== undefined)
  const kept = parsed.segments.filter((segment) => isKeptJpegSegment(bytes, segment)).map((segment) => bytes.subarray(segment.start, segment.end))
  const parts: Uint8Array[] = [bytes.subarray(0, 2)]
  const jfifIndex = parsed.segments.filter((segment) => isKeptJpegSegment(bytes, segment)).findIndex((segment) => segment.marker === 0xe0)
  if (jfifIndex === 0) parts.push(kept.shift()!)
  if (orientation && orientation !== 1) parts.push(orientationOnlyApp1(orientation))
  parts.push(...kept, bytes.subarray(parsed.scanStart))
  return { ok: true, bytes: concat(parts) }
}

/* -------------------------------- PNG ------------------------------- */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
/** Decoding/display chunks only; text, eXIf, tIME and any private/ancillary chunk are dropped. */
const PNG_KEPT = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "cHRM", "gAMA", "iCCP", "sBIT", "sRGB", "bKGD", "hIST", "pHYs", "sPLT", "acTL", "fcTL", "fdAT"])

function pngChunks(bytes: Uint8Array): Array<{ type: string; start: number; end: number }> | null {
  if (!PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return null
  const chunks: Array<{ type: string; start: number; end: number }> = []
  let i = 8
  while (i + 12 <= bytes.length) {
    const length = ((bytes[i] << 24) >>> 0) + ((bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3])
    const end = i + 12 + length
    if (end > bytes.length) return null
    const type = ascii(bytes, i + 4, 4)
    chunks.push({ type, start: i, end })
    i = end
    if (type === "IEND") return chunks
  }
  return null
}

function sanitizePng(bytes: Uint8Array): MetadataSanitizeResultV1 {
  const chunks = pngChunks(bytes)
  if (!chunks) return { ok: false, reason: "MALFORMED" }
  // An unknown CRITICAL chunk (uppercase first letter) cannot be dropped safely.
  if (chunks.some((chunk) => !PNG_KEPT.has(chunk.type) && /^[A-Z]/.test(chunk.type))) return { ok: false, reason: "UNSTRIPPABLE_METADATA" }
  return { ok: true, bytes: concat([bytes.subarray(0, 8), ...chunks.filter((chunk) => PNG_KEPT.has(chunk.type)).map((chunk) => bytes.subarray(chunk.start, chunk.end))]) }
}

/* ------------------------------- WebP ------------------------------- */

const WEBP_KEPT = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP"])

function webpChunks(bytes: Uint8Array): Array<{ id: string; start: number; end: number }> | null {
  if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") return null
  const chunks: Array<{ id: string; start: number; end: number }> = []
  let i = 12
  while (i + 8 <= bytes.length) {
    const size = bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] * 0x1000000)
    const end = i + 8 + size + (size & 1)
    if (end > bytes.length + (size & 1)) return null
    chunks.push({ id: ascii(bytes, i, 4), start: i, end: Math.min(end, bytes.length) })
    i = end
  }
  return chunks.length ? chunks : null
}

function sanitizeWebp(bytes: Uint8Array): MetadataSanitizeResultV1 {
  const chunks = webpChunks(bytes)
  if (!chunks) return { ok: false, reason: "MALFORMED" }
  const kept = chunks.filter((chunk) => WEBP_KEPT.has(chunk.id)).map((chunk) => {
    const copy = bytes.slice(chunk.start, chunk.end)
    // VP8X feature flags: clear EXIF (0x08) and XMP (0x04) -- their chunks are gone.
    if (chunk.id === "VP8X" && copy.length > 8) copy[8] &= ~0x0c
    return copy
  })
  const body = concat(kept)
  const riffSize = body.length + 4
  const header = new Uint8Array([0x52, 0x49, 0x46, 0x46, riffSize & 0xff, (riffSize >> 8) & 0xff, (riffSize >> 16) & 0xff, (riffSize >>> 24) & 0xff, 0x57, 0x45, 0x42, 0x50])
  return { ok: true, bytes: concat([header, body]) }
}

/* -------------------------------- GIF ------------------------------- */

function skipSubBlocks(bytes: Uint8Array, i: number): number | null {
  while (i < bytes.length) {
    const size = bytes[i]
    if (size === 0) return i + 1
    i += size + 1
  }
  return null
}

function sanitizeGif(bytes: Uint8Array): MetadataSanitizeResultV1 {
  if (bytes.length < 13) return { ok: false, reason: "MALFORMED" }
  let i = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 0x07) + 1) : 0)
  const parts: Uint8Array[] = [bytes.subarray(0, i)]
  while (i < bytes.length) {
    const block = bytes[i]
    if (block === 0x3b) {
      parts.push(bytes.subarray(i, i + 1))
      return { ok: true, bytes: concat(parts) }
    }
    if (block === 0x21) {
      const label = bytes[i + 1]
      const end = skipSubBlocks(bytes, i + 2)
      if (end === null) return { ok: false, reason: "MALFORMED" }
      const isComment = label === 0xfe
      const isXmp = label === 0xff && ascii(bytes, i + 3, 11) === "XMP DataXMP"
      if (!isComment && !isXmp) parts.push(bytes.subarray(i, end))
      i = end
      continue
    }
    if (block === 0x2c) {
      const packed = bytes[i + 9]
      const dataStart = i + 10 + (packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0) + 1
      const end = skipSubBlocks(bytes, dataStart)
      if (end === null) return { ok: false, reason: "MALFORMED" }
      parts.push(bytes.subarray(i, end))
      i = end
      continue
    }
    return { ok: false, reason: "MALFORMED" }
  }
  return { ok: false, reason: "MALFORMED" }
}

/* -------------------------------- AVIF ------------------------------- */

/** AVIF metadata lives in ISO-BMFF items; without a full box parser we refuse any file that declares an Exif/XMP item. */
function avifHasMetadata(bytes: Uint8Array): boolean {
  const text = ascii(bytes, 0, Math.min(bytes.length, 64 * 1024))
  return /infe[\s\S]{0,24}Exif/.test(text) || text.includes("application/rdf+xml") || text.includes("<x:xmpmeta")
}

/* ------------------------------- public ------------------------------ */

export function sanitizeImageMetadataV1(bytes: Uint8Array, type: VerifiedImageTypeV1["mime"]): MetadataSanitizeResultV1 {
  switch (type) {
    case "image/jpeg": return sanitizeJpeg(bytes)
    case "image/png": return sanitizePng(bytes)
    case "image/webp": return sanitizeWebp(bytes)
    case "image/gif": return sanitizeGif(bytes)
    case "image/avif": return avifHasMetadata(bytes) ? { ok: false, reason: "UNSTRIPPABLE_METADATA" } : { ok: true, bytes }
  }
}

/**
 * Metadata findings in image bytes (empty = clean). Used as a final check
 * before storing and by tests; never logs or returns metadata values.
 */
export function detectImageMetadataV1(bytes: Uint8Array, type: VerifiedImageTypeV1["mime"]): string[] {
  const findings: string[] = []
  if (type === "image/jpeg") {
    const parsed = jpegSegments(bytes)
    if (!parsed) return ["malformed"]
    for (const segment of parsed.segments) {
      if (segment.marker === 0xe1) {
        const isOrientationOnly = ascii(bytes, segment.start + 4, 6) === "Exif\0\0" && segment.end - segment.start === orientationOnlyApp1(1).length
        if (!isOrientationOnly) findings.push("jpeg-app1")
      } else if (!isKeptJpegSegment(bytes, segment)) findings.push(segment.marker === 0xfe ? "jpeg-comment" : `jpeg-app${segment.marker - 0xe0}`)
    }
  } else if (type === "image/png") {
    const chunks = pngChunks(bytes)
    if (!chunks) return ["malformed"]
    for (const chunk of chunks) if (!PNG_KEPT.has(chunk.type)) findings.push(`png-${chunk.type}`)
  } else if (type === "image/webp") {
    const chunks = webpChunks(bytes)
    if (!chunks) return ["malformed"]
    for (const chunk of chunks) if (!WEBP_KEPT.has(chunk.id)) findings.push(`webp-${chunk.id.trim()}`)
    const vp8x = chunks.find((chunk) => chunk.id === "VP8X")
    if (vp8x && bytes[vp8x.start + 8] & 0x0c) findings.push("webp-vp8x-metadata-flags")
  } else if (type === "image/gif") {
    const sanitized = sanitizeGif(bytes)
    if (!sanitized.ok) return ["malformed"]
    if (sanitized.bytes.length !== bytes.length) findings.push("gif-metadata-extension")
  } else if (avifHasMetadata(bytes)) findings.push("avif-metadata-item")
  return findings
}
