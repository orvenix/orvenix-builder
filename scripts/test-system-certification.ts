import { runSystemCertification } from "../lib/system-certification"

async function main() {
  const report = await runSystemCertification()

  console.dir(report, {
    depth: null,
  })

  if (report.failed > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
