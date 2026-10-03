import test from "node:test"
import assert from "node:assert/strict"
import Module from "node:module"
import path from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const originalResolveFilename = (Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename
;(Module as unknown as { _resolveFilename: (...args: unknown[]) => string })._resolveFilename = function resolveAlias(request: unknown, parent: unknown, isMain: unknown, options: unknown) {
  if (typeof request === "string" && request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(process.cwd(), ".tmp/unit", request.slice(2)), parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

import { sanitizeHtmlV1, safeUrlV1 } from "../../lib/security/html-sanitizer"
import { validateTree } from "../../types/validateTree"
import { renderNodeToHtml } from "../../lib/builder-core/compiler/html"
import { GenericWrapper } from "../../components/editor/primitives/GenericWrapper"
import type { EditorTree, GlobalTheme } from "../../types/editor"

/**
 * SEC-1 (SEC0-03): one policy, three boundaries (persistence, React render,
 * static compiler). An output is unsafe if it can execute script in a browser.
 */

const HOSTILE: Array<[string, string]> = [
  ["script tag", `<p>hi</p><script>alert(1)</script>`],
  ["mixed-case script", `<ScRiPt>alert(1)</sCrIpT>`],
  ["unterminated script", `<p>a</p><script>alert(1)`],
  ["img onerror quoted", `<img src="x" onerror="alert(1)">`],
  ["img onerror unquoted", `<img src=x onerror=alert(1)>`],
  ["mixed-case handler", `<IMG SRC=x OnErRoR=alert(1)>`],
  ["onclick", `<div onclick="alert(1)">click</div>`],
  ["javascript href", `<a href="javascript:alert(1)">x</a>`],
  ["mixed-case javascript href", `<a href="JaVaScRiPt:alert(1)">x</a>`],
  ["unquoted javascript href", `<a href=javascript:alert(1)>x</a>`],
  ["entity-encoded javascript", `<a href="&#106;avascript:alert(1)">x</a>`],
  ["tab inside scheme", `<a href="java&#x09;script:alert(1)">x</a>`],
  ["leading space scheme", `<a href="  javascript:alert(1)">x</a>`],
  ["vbscript", `<a href="vbscript:msgbox(1)">x</a>`],
  ["data html href", `<a href="data:text/html,<script>alert(1)</script>">x</a>`],
  ["data image src", `<img src="data:image/svg+xml,<svg onload=alert(1)>">`],
  ["iframe", `<iframe src="https://evil.example"></iframe>`],
  ["iframe srcdoc", `<iframe srcdoc="<script>alert(1)</script>"></iframe>`],
  ["object", `<object data="evil.swf"></object>`],
  ["embed", `<embed src="evil.swf">`],
  ["svg onload", `<svg onload="alert(1)"><circle/></svg>`],
  ["svg script", `<svg><script>alert(1)</script></svg>`],
  ["math href", `<math><a xlink:href="javascript:alert(1)">x</a></math>`],
  ["style tag", `<style>body{background:url(javascript:alert(1))}</style>`],
  ["style attr", `<p style="background:url(javascript:alert(1))">x</p>`],
  ["form action", `<form action="https://evil.example"><input name="password"><button>go</button></form>`],
  ["meta refresh", `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`],
  ["base href", `<base href="https://evil.example/">`],
  ["noscript breakout", `<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>`],
  ["textarea breakout", `<textarea><img src=x onerror=alert(1)></textarea>`],
  ["comment breakout", `<!--<img src=x onerror=alert(1)>-->`],
  ["attribute breakout", `<p title='"><script>alert(1)</script>'>x</p>`],
  ["srcset", `<img srcset="javascript:alert(1)">`],
  ["formaction", `<button formaction="javascript:alert(1)">x</button>`],
  ["template", `<template><script>alert(1)</script></template>`],
]

function assertInert(html: string, label: string) {
  const lower = html.toLowerCase()
  assert.equal(/<script/.test(lower), false, `${label}: <script survived -> ${html}`)
  assert.equal(/<(iframe|object|embed|svg|math|style|form|input|button|meta|base|link|textarea|noscript|template)\b/.test(lower), false, `${label}: active tag survived -> ${html}`)
  // An event-handler attribute can only exist inside a tag: look at tag interiors only.
  for (const tag of html.match(/<[^>]*>/g) ?? []) {
    assert.equal(/\son[a-z]+\s*=/i.test(tag), false, `${label}: event handler survived -> ${tag}`)
    assert.equal(/javascript:|vbscript:|data:/i.test(tag), false, `${label}: active URL survived -> ${tag}`)
    assert.equal(/\s(style|srcset|formaction|action|xlink:href|srcdoc)=/i.test(tag), false, `${label}: unsafe attribute survived -> ${tag}`)
  }
}

test("sanitizer: every hostile fixture becomes inert", () => {
  for (const [label, input] of HOSTILE) assertInert(sanitizeHtmlV1(input), label)
})

test("sanitizer: legitimate formatting survives", () => {
  const safe = `<h2>Título</h2><p>Hola <strong>mundo</strong> y <em>más</em><br>línea</p><ul><li>uno</li><li>dos</li></ul><a href="https://orvenix.com/precios" target="_blank">Precios</a><a href="/contacto">Contacto</a><a href="mailto:hola@orvenix.com">Mail</a><img src="/uploads/a.png" alt="Foto" width="320">`
  const out = sanitizeHtmlV1(safe)
  for (const fragment of [
    "<h2>Título</h2>",
    "<strong>mundo</strong>",
    "<em>más</em>",
    "<br>",
    "<ul><li>uno</li><li>dos</li></ul>",
    `<a href="https://orvenix.com/precios" target="_blank" rel="noopener noreferrer">Precios</a>`,
    `<a href="/contacto">Contacto</a>`,
    `<a href="mailto:hola@orvenix.com">Mail</a>`,
    `<img src="/uploads/a.png" alt="Foto" width="320">`,
  ]) {
    assert.ok(out.includes(fragment), `missing ${fragment} in ${out}`)
  }
})

test("sanitizer: text is re-escaped; unknown tags are unwrapped, not dropped", () => {
  assert.equal(sanitizeHtmlV1(`a &lt;script&gt; b`), "a &lt;script&gt; b")
  assert.equal(sanitizeHtmlV1(`<custom-el>hola</custom-el>`), "hola")
  assert.equal(sanitizeHtmlV1(`<p>sin cerrar`), "<p>sin cerrar</p>")
  assert.equal(sanitizeHtmlV1(`<script>alert(1)</script>texto`), "texto")
  assert.equal(sanitizeHtmlV1(undefined), "")
  assert.equal(sanitizeHtmlV1(42), "")
})

test("safeUrlV1: scheme allowlist with control-character normalization", () => {
  assert.equal(safeUrlV1("https://a.example/x"), "https://a.example/x")
  assert.equal(safeUrlV1("/relative"), "/relative")
  assert.equal(safeUrlV1("#anchor"), "#anchor")
  assert.equal(safeUrlV1("tel:+5255"), "tel:+5255")
  for (const bad of ["javascript:alert(1)", "JAVASCRIPT:x", "java\tscript:x", "java\u0000script:x", " javascript:x", "vbscript:x", "data:text/html,x", "\\\\evil.example"]) {
    assert.equal(safeUrlV1(bad), null, bad)
  }
})

function treeWith(content: string): EditorTree {
  return {
    rootId: "root",
    nodes: {
      root: { id: "root", type: "section", props: {}, children: ["gw"], version: 1 },
      gw: { id: "gw", type: "genericWrapper", props: { originalType: "div", content }, children: [], parentId: "root", version: 1 },
    },
  } as unknown as EditorTree
}

test("boundary A (persistence): validateTree sanitizes genericWrapper.content for every hostile fixture", () => {
  for (const [label, input] of HOSTILE) {
    const tree = validateTree(treeWith(input))
    assertInert(String(tree.nodes.gw.props.content ?? ""), label)
  }
  const legit = validateTree(treeWith("<p>Hola <strong>mundo</strong></p>"))
  assert.equal(legit.nodes.gw.props.content, "<p>Hola <strong>mundo</strong></p>")
})

test("boundary B (React/public render): GenericWrapper renders only sanitized markup even from an unsanitized tree", () => {
  for (const [label, input] of HOSTILE) {
    const html = renderToStaticMarkup(createElement(GenericWrapper as unknown as (props: Record<string, unknown>) => null, { originalType: "div", content: input }))
    assertInert(html, label)
  }
  const html = renderToStaticMarkup(createElement(GenericWrapper as unknown as (props: Record<string, unknown>) => null, { originalType: "div", content: "<p>Hola <em>mundo</em></p>" }))
  assert.ok(html.includes("<p>Hola <em>mundo</em></p>"), html)
})

test("boundary C (static compiler): renderNodeToHtml never emits raw genericWrapper.content", () => {
  const theme = {} as GlobalTheme
  for (const [label, input] of HOSTILE) {
    const tree = treeWith(input) // deliberately NOT passed through validateTree
    assertInert(renderNodeToHtml(tree.nodes.gw, tree, theme), label)
  }
  const tree = treeWith("<p>Hola <strong>mundo</strong></p>")
  assert.ok(renderNodeToHtml(tree.nodes.gw, tree, theme).includes("<p>Hola <strong>mundo</strong></p>"))
})
