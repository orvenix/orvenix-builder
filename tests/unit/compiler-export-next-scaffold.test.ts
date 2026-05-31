import test from "node:test"
import assert from "node:assert/strict"
import {
  EXPORT_NEXT_VERSION,
  EXPORT_REACT_VERSION,
  buildNextExportConfig,
  buildNextExportPackageJson,
  buildNextExportReadme,
  buildNextExportScaffold,
} from "../../lib/builder-core/compiler/exportNextScaffold"

test("compiler export next scaffold builds package json with pinned versions", () => {
  const pkg = JSON.parse(buildNextExportPackageJson("Sitio Demo")) as {
    name: string
    dependencies: Record<string, string>
  }

  assert.equal(pkg.name, "sitio-demo")
  assert.equal(pkg.dependencies.next, EXPORT_NEXT_VERSION)
  assert.equal(pkg.dependencies.react, EXPORT_REACT_VERSION)
  assert.equal(pkg.dependencies["react-dom"], EXPORT_REACT_VERSION)
})

test("compiler export next scaffold builds config and readme", () => {
  const config = buildNextExportConfig()
  const readme = buildNextExportReadme("Sitio Demo", "Titulo SEO", "Descripcion SEO")
  const scaffold = buildNextExportScaffold("Sitio Demo", "Titulo SEO", "Descripcion SEO")

  assert.match(config, /remotePatterns/)
  assert.match(readme, /# Sitio Demo/)
  assert.match(readme, /\*\*Título:\*\* Titulo SEO/)
  assert.equal(scaffold.packageJson, buildNextExportPackageJson("Sitio Demo"))
  assert.equal(scaffold.nextConfig, config)
  assert.equal(scaffold.readme, readme)
})
