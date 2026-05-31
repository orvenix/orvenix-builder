import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const schemaPath = "prisma/editor.prisma"
const migrationsDir = join(process.cwd(), "prisma", "migrations")

function getVersionedMigrations() {
  if (!existsSync(migrationsDir)) return []

  return readdirSync(migrationsDir)
    .filter((entry) => {
      const fullPath = join(migrationsDir, entry)
      return statSync(fullPath).isDirectory()
    })
    .sort()
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function main() {
  const migrations = getVersionedMigrations()

  if (!migrations.length) {
    console.log("No versioned Prisma migrations found. Running prisma db push for this workspace.")
    run("prisma", ["db", "push", `--schema=${schemaPath}`])
    return
  }

  console.log("Versioned Prisma migrations detected. Running migrate deploy.")
  run("prisma", ["migrate", "deploy", `--schema=${schemaPath}`])
}

main()
