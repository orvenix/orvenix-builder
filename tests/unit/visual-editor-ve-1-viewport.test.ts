import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { readFileSync } from "node:fs"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { CLIENT_VIEWPORT_WIDTHS, computeViewportScale } from "../../components/editor/client-shell/IsolatedViewportFrame"

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8")

/** Tailwind v4 default breakpoints (min-width, in px at 16px/rem): sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem. */
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const
const activeBreakpoints = (viewportWidth: number) => Object.entries(BREAKPOINTS).filter(([, min]) => viewportWidth >= min).map(([name]) => name)

test("VIEWPORT: logical website widths select the intended Tailwind breakpoints", () => {
  assert.deepEqual(CLIENT_VIEWPORT_WIDTHS, { desktop: 1280, tablet: 834, mobile: 390 })
  assert.deepEqual(activeBreakpoints(CLIENT_VIEWPORT_WIDTHS.desktop), ["sm", "md", "lg", "xl"], "desktop layout")
  assert.deepEqual(activeBreakpoints(CLIENT_VIEWPORT_WIDTHS.tablet), ["sm", "md"], "tablet layout")
  assert.deepEqual(activeBreakpoints(CLIENT_VIEWPORT_WIDTHS.mobile), [], "mobile layout")
})

test("VIEWPORT: the frame scales to fit and never reflows or enlarges", () => {
  assert.equal(computeViewportScale(1024, 1280), 0.8, "a 1024px editor area shows the 1280px site at 80%")
  assert.equal(computeViewportScale(1600, 1280), 1, "never enlarged")
  assert.equal(computeViewportScale(390, 390), 1)
  assert.equal(computeViewportScale(0, 1280), 1, "unmeasured area keeps scale 1")
  assert.equal(computeViewportScale(Number.NaN, 1280), 1)
})

test("VIEWPORT: media queries follow the website viewport -- the iframe IS the logical width, scaled visually", () => {
  const frame = read("components/editor/client-shell/IsolatedViewportFrame.tsx")
  assert.match(frame, /style=\{\{ width: logicalWidth, height: frameHeight, transform: `scale\(\$\{scale\}\)`, transformOrigin: "top left" \}\}/)
  assert.match(frame, /srcDoc=\{FRAME_DOCUMENT\}/)
  assert.match(frame, /<!DOCTYPE html>/, "standards mode, like the public page")
  assert.match(frame, /createPortal\(children, mountNode\)/, "same React tree: store, contexts and DnD are shared, no second renderer")
  assert.match(frame, /document\.head\.querySelectorAll\('link\[rel="stylesheet"\], style'\)/, "same global CSS, fonts and theme")
  assert.match(frame, /frameDocument\.body\.className = document\.body\.className/, "same body font variables")
  assert.match(frame, /new MutationObserver/, "stylesheet changes (dev hot reload) are mirrored")
  assert.doesNotMatch(frame, /setInterval|DynamicRenderer|PublicRenderer/)
})

test("VIEWPORT: the customer shell renders the site and its overlay inside the isolated viewport", () => {
  const shell = read("components/editor/client-shell/ClientShell.tsx")
  const frameStart = shell.indexOf("<IsolatedViewportFrame logicalWidth={logicalWidth} onFrameWindow={setFrameWindow}>")
  const frameEnd = shell.indexOf("</IsolatedViewportFrame>")
  assert.ok(frameStart > 0 && frameEnd > frameStart)
  const inside = shell.slice(frameStart, frameEnd)
  assert.match(inside, /<ClientPageRenderer \/>/)
  assert.match(inside, /<CustomerSelectionOverlay containerRef=\{canvasRef\} \/>/, "overlay coordinates live in the same document and scale as the site")
  assert.match(shell, /CLIENT_VIEWPORT_WIDTHS\[/)
  assert.doesNotMatch(shell, /DEVICE_WIDTHS|style=\{frameWidth/, "no editor-box narrowing")
  assert.match(shell, /useKeyboardShortcuts\(\{ extraWindow: frameWindow \}\)/)
})

test("VIEWPORT: keyboard, overlay and inline editing work in the frame document", () => {
  const keys = read("hooks/useKeyboardShortcuts.ts")
  assert.match(keys, /extraWindow\?\.addEventListener\("keydown", handler\)/)
  assert.match(keys, /extraWindow\?\.removeEventListener\("keydown", handler\)/)
  const overlay = read("components/editor/selection/CustomerSelectionOverlay.tsx")
  assert.match(overlay, /element\.ownerDocument\.defaultView \?\? window/)
  assert.match(overlay, /view\?\.ResizeObserver/)
  for (const file of ["components/editor/primitives/Heading.tsx", "components/editor/primitives/Text.tsx", "components/editor/primitives/CtaButton.tsx"]) {
    const source = read(file)
    assert.match(source, /ownerDocument\.activeElement ===/, file)
    assert.match(source, /ownerDocument\.createRange\(\)/, file)
    assert.match(source, /ownerDocument\.defaultView\?\.getSelection\(\)/, file)
    assert.doesNotMatch(source, /\bdocument\.(activeElement|createRange)|window\.getSelection\(/, file)
  }
})

test("VIEWPORT: Studio keeps its own canvas (unchanged)", () => {
  const studio = read("components/editor/shell/EditorShell.tsx")
  assert.doesNotMatch(studio, /IsolatedViewportFrame/)
  assert.match(read("components/editor/Canvas.tsx"), /DEVICE_WIDTHS\[currentDevice\]/)
})
