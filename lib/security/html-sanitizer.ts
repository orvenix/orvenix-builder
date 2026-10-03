import { Parser } from "htmlparser2"

/**
 * SEC-1 (SEC0-03): the ONE HTML-safety policy for tenant-authored markup
 * (today: `genericWrapper.props.content`). Used at persistence
 * (validateTree), at the React render boundary (GenericWrapper) and at the
 * static compiler boundary (renderNodeToHtml).
 *
 * Design: parse with htmlparser2 (the mature parser sanitize-html is built
 * on) and RE-SERIALIZE from an allowlist. Nothing from the input is copied
 * through verbatim: tag and attribute names come from the allowlist, text is
 * re-escaped, and attribute values are re-escaped inside double quotes. The
 * output grammar therefore cannot contain script, event handlers, active
 * URLs or raw-text elements, whatever the input parser made of hostile
 * markup. Unknown tags are unwrapped (their text survives, escaped);
 * active/raw-text containers are dropped together with their content.
 */

const ALLOWED_TAGS = new Set([
  "a", "abbr", "article", "aside", "b", "blockquote", "br", "caption", "cite", "code",
  "dd", "del", "details", "div", "dl", "dt", "em", "figcaption", "figure", "footer",
  "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "i", "img", "ins", "kbd", "li",
  "main", "mark", "ol", "p", "pre", "q", "s", "section", "small", "span", "strong",
  "sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr",
  "u", "ul",
])

const VOID_TAGS = new Set(["br", "hr", "img"])

/** Dropped WITH everything inside them (active content or raw-text elements). */
const DISCARD_WITH_CONTENT_TAGS = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet", "noscript",
  "noembed", "noframes", "template", "svg", "math", "textarea", "select", "option", "title",
  "xmp", "plaintext", "head", "base", "link", "meta", "audio", "video", "canvas", "portal",
])

const GLOBAL_ATTRIBUTES = new Set(["class", "title", "lang", "dir"])

const TAG_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  ol: new Set(["start", "reversed"]),
  time: new Set(["datetime"]),
  q: new Set(["cite"]),
  blockquote: new Set(["cite"]),
}

const URL_ATTRIBUTES = new Set(["href", "src", "cite"])
const LINK_SCHEMES = new Set(["http", "https", "mailto", "tel"])
const IMAGE_SCHEMES = new Set(["http", "https"])
const MAX_INPUT_LENGTH = 200_000

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeAttribute(value: string) {
  return escapeText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

/**
 * Returns the URL when its scheme is allowed (or it is relative), else null.
 * Control characters and whitespace are removed before the scheme check so
 * `jav&#x09;ascript:` / ` javascript:` / `java\0script:` cannot slip through.
 */
export function safeUrlV1(raw: string, allowedSchemes: ReadonlySet<string> = LINK_SCHEMES): string | null {
  const compact = raw.replace(/[\u0000- \u007f-\u009f]/g, "")
  if (!compact) return null
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(compact)
  if (scheme) return allowedSchemes.has(scheme[1].toLowerCase()) ? raw.trim() : null
  // Relative URL. A leading "\\" is normalized to "/" by browsers: block it.
  if (compact.startsWith("\\") || compact.startsWith("/\\")) return null
  return raw.trim()
}

function sanitizeAttributes(tag: string, attribs: Record<string, string>) {
  const allowedForTag = TAG_ATTRIBUTES[tag]
  const out: Array<[string, string]> = []
  let target: string | null = null
  for (const [name, value] of Object.entries(attribs)) {
    if (!GLOBAL_ATTRIBUTES.has(name) && !allowedForTag?.has(name)) continue
    if (URL_ATTRIBUTES.has(name)) {
      const url = safeUrlV1(value, tag === "img" ? IMAGE_SCHEMES : LINK_SCHEMES)
      if (url === null) continue
      out.push([name, url])
      continue
    }
    if (name === "target") {
      if (value === "_blank" || value === "_self") target = value
      continue
    }
    if (name === "rel") continue // recomputed below
    if ((name === "width" || name === "height" || name === "colspan" || name === "rowspan" || name === "start") && !/^\d{1,5}$/.test(value)) continue
    if (name === "loading" && value !== "lazy" && value !== "eager") continue
    out.push([name, value])
  }
  if (tag === "a" && target) {
    out.push(["target", target])
    if (target === "_blank") out.push(["rel", "noopener noreferrer"])
  }
  return out.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join("")
}

/** Sanitizes untrusted HTML into the allowlisted subset. Never throws. */
export function sanitizeHtmlV1(input: unknown): string {
  if (typeof input !== "string" || input.length === 0) return ""
  const source = input.length > MAX_INPUT_LENGTH ? input.slice(0, MAX_INPUT_LENGTH) : input

  let output = ""
  let discardDepth = 0
  const open: string[] = []

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (discardDepth > 0) {
          if (DISCARD_WITH_CONTENT_TAGS.has(name)) discardDepth += 1
          return
        }
        if (DISCARD_WITH_CONTENT_TAGS.has(name)) {
          discardDepth = 1
          return
        }
        if (!ALLOWED_TAGS.has(name)) return // unwrap: children/text still processed
        output += `<${name}${sanitizeAttributes(name, attribs)}>`
        if (!VOID_TAGS.has(name)) open.push(name)
      },
      ontext(text) {
        if (discardDepth > 0) return
        output += escapeText(text)
      },
      onclosetag(name) {
        if (discardDepth > 0) {
          if (DISCARD_WITH_CONTENT_TAGS.has(name)) discardDepth -= 1
          return
        }
        if (!ALLOWED_TAGS.has(name) || VOID_TAGS.has(name)) return
        const index = open.lastIndexOf(name)
        if (index === -1) return
        while (open.length > index) output += `</${open.pop()}>`
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true, recognizeSelfClosing: false },
  )

  try {
    parser.write(source)
    parser.end()
  } catch {
    return escapeText(source)
  }
  while (open.length > 0) output += `</${open.pop()}>`
  return output
}

/**
 * Applies the policy to every node prop that is rendered as raw HTML.
 * Today that is only `genericWrapper.props.content`. Returns the same props
 * object when nothing changes.
 */
export function sanitizeNodeHtmlPropsV1(type: string, props: Record<string, unknown>): Record<string, unknown> {
  if (type !== "genericWrapper" || typeof props.content !== "string" || props.content.length === 0) return props
  const content = sanitizeHtmlV1(props.content)
  return content === props.content ? props : { ...props, content }
}
