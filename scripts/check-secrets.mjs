#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const SECRET_PATTERNS = [
  { name: "Stripe secret/restricted key", pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: "Stripe webhook secret", pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/g },
  { name: "Anthropic API key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Resend API key", pattern: /\bre_[A-Za-z0-9_-]{20,}\b/g },
  { name: "MercadoPago access token", pattern: /\b(?:APP_USR|TEST)-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Database URL with inline password", pattern: /\b(?:mysql|mariadb|postgres(?:ql)?):\/\/[^\s:@]+:[^\s@<>]+@[^\s"\']+/g },
]

const ALLOWED_FILES = new Set([
  ".env.example",
  "README.md",
])

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !file.startsWith(".next/") && !file.startsWith("node_modules/") && !file.startsWith(".tmp/"))

const findings = []

for (const file of files) {
  let content
  try {
    content = readFileSync(file, "utf8")
  } catch {
    continue
  }

  if (content.includes("\u0000")) continue

  for (const { name, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const value = match[0]
      const lower = value.toLowerCase()
      const isObviousPlaceholder =
        value.includes("<") ||
        lower.includes("xxxxx") ||
        lower.includes("placeholder") ||
        lower.includes("replace")

      if (ALLOWED_FILES.has(file) && isObviousPlaceholder) continue

      findings.push({ file, name, preview: value.slice(0, 8) + "..." })
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed. Posibles secretos versionados:")
  for (const finding of findings) {
    console.error("- " + finding.file + ": " + finding.name + " (" + finding.preview + ")")
  }
  console.error("\nMueve esos valores a .env/.env.local o al gestor de secretos del servidor.")
  process.exit(1)
}

console.log("Secret scan OK: " + files.length + " archivos versionados revisados.")
