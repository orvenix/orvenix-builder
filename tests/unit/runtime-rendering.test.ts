import test from "node:test"
import assert from "node:assert/strict"
import {
  getRuntimeDeviceFromWidth,
  getRuntimeFreePositionStyle,
  getRuntimePreviewMinHeight,
  getRuntimeThemeStyleVars,
} from "../../lib/builder-core/runtime/rendering"
import type { DeviceMode, EditorTree, GlobalTheme, NodeProps } from "../../types/editor"

test("runtime rendering helpers resolve device mode from viewport width", () => {
  assert.equal(getRuntimeDeviceFromWidth(375), "mobile")
  assert.equal(getRuntimeDeviceFromWidth(900), "tablet")
  assert.equal(getRuntimeDeviceFromWidth(1440), "desktop")
})

test("runtime rendering helpers expose theme css variables", () => {
  const theme: GlobalTheme = {
    colors: {
      primary: "#2563eb",
      secondary: "#0f172a",
      background: "#ffffff",
      text: "#111827",
      accent: "#22c55e",
    },
    fontHeading: "Sora",
    fontBody: "Inter",
    spacing: {
      sectionX: "2rem",
      sectionY: "4rem",
      stack: "1.5rem",
    },
    radius: {
      card: "1rem",
      button: "999px",
    },
    shadow: {
      soft: "0 8px 24px rgba(0,0,0,0.08)",
      strong: "0 24px 60px rgba(0,0,0,0.16)",
    },
    motion: {
      duration: "180ms",
      easing: "ease-out",
    },
  }

  const vars = getRuntimeThemeStyleVars(theme)
  assert.equal(vars["--primary"], "#2563eb")
  assert.equal(vars["--font-heading"], "Sora")
  assert.equal(vars["--space-section-y"], "4rem")
  assert.equal(vars["--motion-easing"], "ease-out")
})

test("runtime rendering helpers compute preview min-height using resolved free nodes", () => {
  const tree: EditorTree = {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        type: "section",
        props: {},
        children: ["free", "flow"],
        version: 1,
      },
      free: {
        id: "free",
        type: "genericWrapper",
        props: {
          positionMode: "free",
          y: 700,
          height: 200,
        },
        children: [],
        version: 1,
        parentId: "root",
      },
      flow: {
        id: "flow",
        type: "text",
        props: {
          content: "Hola",
        },
        children: [],
        version: 1,
        parentId: "root",
      },
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const passthrough = (props: NodeProps | undefined, _device: DeviceMode) => props ?? {}
  assert.equal(getRuntimePreviewMinHeight(tree, "desktop", passthrough), 948)
})

test("runtime rendering helpers build free-position style with pixel sizes", () => {
  const style = getRuntimeFreePositionStyle(
    {
      x: 18,
      y: 42,
      width: 320,
      height: 180,
      zIndex: 3,
    },
    { opacity: 0.8 }
  )

  assert.equal(style.position, "absolute")
  assert.equal(style.left, 18)
  assert.equal(style.top, 42)
  assert.equal(style.width, "320px")
  assert.equal(style.height, "180px")
  assert.equal(style.zIndex, 3)
  assert.equal(style.opacity, 0.8)
})
