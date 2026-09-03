export {}

async function main() {
  process.loadEnvFile(".env")

  const {
    publishSiteForActor,
    SitePublicationError,
  } = await import(
    "@/lib/site-publication"
  )

  let capturedError:
    unknown

  try {
    await publishSiteForActor({
      siteId:
        "site_1a9dba45c3ad",

      actor: {
        userId:
          "unauthorized-publication-test-user",

        role:
          "CLIENT",
      },
    })
  } catch (error) {
    capturedError =
      error
  }

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — PUBLICATION AUTHORIZATION",
  )

  console.log(
    "========================================",
  )

  console.log("")
  console.log(
    "IS TYPED ERROR:",
    capturedError instanceof
      SitePublicationError,
  )

  console.log(
    "ERROR CODE:",
    capturedError instanceof
      SitePublicationError
      ? capturedError.code
      : null,
  )

  if (
    !(
      capturedError instanceof
      SitePublicationError
    ) ||
    capturedError.code !==
      "FORBIDDEN"
  ) {
    throw new Error(
      "El servicio no bloqueó al actor sin autorización.",
    )
  }

  console.log("")
  console.log(
    "PUBLICATION AUTHORIZATION VALIDADA.",
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("")
    console.error(
      "PUBLICATION AUTHORIZATION TEST ERROR:",
      error,
    )

    process.exit(1)
  })
