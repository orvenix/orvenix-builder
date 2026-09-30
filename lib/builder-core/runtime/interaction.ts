/**
 * PCE-4A: small, DOM-light interaction primitives shared by generated-site
 * overlays (CartDrawer, SiteNav mobile menu). Structural types keep them
 * testable without a DOM implementation.
 */

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ")

export type FocusableLike = {
  focus: (options?: { preventScroll?: boolean }) => void
  isConnected?: boolean
  getAttribute?: (name: string) => string | null
}

export type FocusContainerLike<T extends FocusableLike = FocusableLike> = {
  querySelectorAll: (selector: string) => ArrayLike<T>
  contains: (node: unknown) => boolean
}

export function isEscapeKey(event: { key?: string }) {
  return event.key === "Escape" || event.key === "Esc"
}

export function getFocusableElements<T extends FocusableLike>(container: FocusContainerLike<T> | null | undefined): T[] {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute?.("aria-hidden") !== "true"
  )
}

/**
 * Bounded focus trap: returns the element Tab/Shift+Tab should move to, or
 * null to let the browser handle the key normally.
 */
export function resolveFocusTrapTarget<T extends FocusableLike>(input: {
  focusables: readonly T[]
  active: unknown
  shiftKey: boolean
  activeInside: boolean
}): T | null {
  const { focusables, active, shiftKey, activeInside } = input
  if (focusables.length === 0) return null
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!activeInside) return shiftKey ? last : first
  if (shiftKey && active === first) return last
  if (!shiftKey && active === last) return first
  return null
}

/** Returns focus to a trigger only if it still exists in the document. */
export function restoreFocus(element: FocusableLike | null | undefined): boolean {
  if (!element || element.isConnected === false || typeof element.focus !== "function") return false
  element.focus({ preventScroll: true })
  return true
}

type ScrollLockBody = { style: { overflow: string } }

const scrollLocks = new WeakMap<ScrollLockBody, { count: number; previousOverflow: string }>()

/**
 * Reference-counted body scroll lock. Nested/overlapping locks (e.g. two
 * drawers) restore the ORIGINAL overflow only when the last one releases.
 * The returned release function is idempotent.
 */
export function lockBodyScroll(body: ScrollLockBody): () => void {
  const existing = scrollLocks.get(body)
  if (existing) {
    existing.count += 1
  } else {
    scrollLocks.set(body, { count: 1, previousOverflow: body.style.overflow })
    body.style.overflow = "hidden"
  }

  let released = false
  return () => {
    if (released) return
    released = true
    const lock = scrollLocks.get(body)
    if (!lock) return
    lock.count -= 1
    if (lock.count <= 0) {
      body.style.overflow = lock.previousOverflow
      scrollLocks.delete(body)
    }
  }
}

export function prefersReducedMotion(win: { matchMedia?: (query: string) => { matches: boolean } } | undefined): boolean {
  try {
    return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  } catch {
    return false
  }
}
