"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

/**
 * VE-1 isolated website viewport: logical widths the WEBSITE is laid out at
 * (matching the approved commercial review frames). The editor never lets
 * its own chrome decide the site's responsive layout.
 */
export const CLIENT_VIEWPORT_WIDTHS = { desktop: 1280, tablet: 834, mobile: 390 } as const
export type ClientViewportDevice = keyof typeof CLIENT_VIEWPORT_WIDTHS

/** Visual scale to fit the logical viewport into the available width (never enlarges). */
export function computeViewportScale(availableWidth: number, logicalWidth: number): number {
  if (!(availableWidth > 0) || !(logicalWidth > 0)) return 1
  return Math.min(1, availableWidth / logicalWidth)
}

const FRAME_STYLE_ATTRIBUTE = "data-orvenix-frame-style"
const FRAME_DOCUMENT = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"></head><body></body></html>"

/** Mirrors the editor page's stylesheets and root classes (fonts, theme) into the frame document. */
function syncFrameDocument(frameDocument: Document) {
  frameDocument.head.querySelectorAll(`[${FRAME_STYLE_ATTRIBUTE}]`).forEach((node) => node.remove())
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    const clone = node.cloneNode(true) as HTMLElement
    clone.setAttribute(FRAME_STYLE_ATTRIBUTE, "")
    frameDocument.head.appendChild(clone)
  })
  frameDocument.documentElement.className = document.documentElement.className
  frameDocument.documentElement.lang = document.documentElement.lang
  frameDocument.body.className = document.body.className
}

/**
 * Renders `children` (the SAME React tree: store, contexts, DnD) through a
 * portal into a same-origin iframe whose width IS the website's logical
 * viewport, so CSS media queries (Tailwind md:/lg:/xl:) follow the website
 * viewport, not the editor window. When the editor area is narrower than
 * the logical width, the whole frame is scaled visually -- never reflowed.
 */
export function IsolatedViewportFrame({
  logicalWidth,
  onFrameWindow,
  children,
}: {
  logicalWidth: number
  onFrameWindow?: (frameWindow: Window | null) => void
  children: ReactNode
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null)
  const [available, setAvailable] = useState({ width: 0, height: 0 })

  // One observer for the editor area that hosts the frame (not per site node).
  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const update = () => setAvailable({ width: outer.clientWidth, height: outer.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(outer)
    return () => observer.disconnect()
  }, [])

  // Frame document: mount point + stylesheet/class mirroring (re-synced when the page head changes, eg. dev hot reload).
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    let observer: MutationObserver | null = null
    let frame = 0
    const attach = () => {
      const frameDocument = iframe.contentDocument
      if (!frameDocument?.body) return
      syncFrameDocument(frameDocument)
      let mount = frameDocument.getElementById("orvenix-site-viewport")
      if (!mount) {
        mount = frameDocument.createElement("div")
        mount.id = "orvenix-site-viewport"
        frameDocument.body.appendChild(mount)
      }
      setMountNode(mount)
      onFrameWindow?.(iframe.contentWindow)
      observer?.disconnect()
      observer = new MutationObserver(() => {
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; syncFrameDocument(frameDocument) })
      })
      observer.observe(document.head, { childList: true, subtree: true, characterData: true })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] })
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })
    }
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.body) attach()
    iframe.addEventListener("load", attach)
    return () => {
      iframe.removeEventListener("load", attach)
      observer?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      onFrameWindow?.(null)
    }
  }, [onFrameWindow])

  const scale = computeViewportScale(available.width, logicalWidth)
  const frameHeight = available.height > 0 ? available.height / scale : 0

  return (
    <div ref={outerRef} className="relative h-full w-full overflow-hidden">
      <div className="relative mx-auto h-full" style={{ width: logicalWidth * scale }}>
        <iframe
          ref={iframeRef}
          title="Vista de tu sitio"
          srcDoc={FRAME_DOCUMENT}
          className="absolute left-0 top-0 block border-0 bg-white shadow-sm"
          style={{ width: logicalWidth, height: frameHeight, transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
      {mountNode && createPortal(children, mountNode)}
    </div>
  )
}
