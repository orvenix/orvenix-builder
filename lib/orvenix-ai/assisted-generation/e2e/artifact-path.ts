import path from "node:path"

/**
 * ASSISTED-4A: the ONE local, gitignored (/.tmp/) artifact the dev
 * comparison harness writes and the dev viewer reads. Never a DB row.
 */
export const ASSISTED_COMPARISON_ARTIFACT_PATH_V1 = path.join(
  process.cwd(),
  ".tmp",
  "dev-assisted-generation-e2e",
  "novamarket-comparison.json",
)
