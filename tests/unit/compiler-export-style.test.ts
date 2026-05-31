import test from "node:test"
import assert from "node:assert/strict"
import {
  buildExportStyleModel,
  buildHtmlStyleAttr,
  buildJsxStyleExpr,
} from "../../lib/builder-core/compiler/exportStyle"
import type { NodeProps } from "../../types/editor"

test("compiler export style builds a normalized style model", () => {
  const props: NodeProps = {
    styleBackground: "#111827",
    styleOpacity: 80,
    stylePadding: 24,
    styleRadius: 18,
    styleBorderWidth: 2,
    styleBorderColor: "#0ea5e9",
    positionMode: "free",
    x: 12,
    y: 24,
    width: 360,
    height: 180,
    customCss: "transform:scale(1.02)",
  }

  const model = buildExportStyleModel(props)
  assert.equal(model.background, "#111827")
  assert.equal(model.opacity, 0.8)
  assert.equal(model.padding, 24)
  assert.equal(model.borderRadius, 18)
  assert.equal(model.border, "2px solid #0ea5e9")
  assert.equal(model.position, "absolute")
  assert.equal(model.left, 12)
  assert.equal(model.width, 360)
  assert.equal(model.customCss, "transform:scale(1.02)")
})

test("compiler export style builds html style attr", () => {
  const props: NodeProps = {
    styleBackground: "#111827",
    stylePadding: 16,
    positionMode: "free",
    x: 10,
    y: 20,
  }

  const attr = buildHtmlStyleAttr(props, String)
  assert.match(attr, /style="/)
  assert.match(attr, /background:#111827/)
  assert.match(attr, /padding:16px/)
  assert.match(attr, /position:absolute/)
  assert.match(attr, /left:10px/)
  assert.match(attr, /top:20px/)
})

test("compiler export style builds jsx style expression", () => {
  const props: NodeProps = {
    styleBackground: "#111827",
    styleRadius: 12,
    styleBorderWidth: 1,
    styleBorderColor: "#e2e8f0",
    width: 320,
    height: 120,
    positionMode: "free",
  }

  const expr = buildJsxStyleExpr(props)
  assert.match(expr, /style=\{\{/)
  assert.match(expr, /background: "#111827"/)
  assert.match(expr, /borderRadius: 12/)
  assert.match(expr, /border: "1px solid #e2e8f0"/)
  assert.match(expr, /position: "absolute"/)
  assert.match(expr, /width: 320/)
  assert.match(expr, /height: 120/)
})
