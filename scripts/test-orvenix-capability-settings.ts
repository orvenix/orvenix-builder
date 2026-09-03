export {}

async function main() {
  const {
    getCapabilitySetting,
    isCapabilityValueAllowed,
  } = await import(
    "@/lib/orvenix-ai"
  )

  console.log(
    "========================================",
  )

  console.log(
    "ORVENIX AI — CAPABILITY SETTINGS",
  )

  console.log(
    "========================================",
  )

  const padding =
    getCapabilitySetting(
      "section",
      "paddingY",
    )

  console.log("")
  console.log(
    "=== SECTION.paddingY ===",
  )

  console.dir(
    padding,
    {
      depth: 10,
    },
  )

  const radius =
    getCapabilitySetting(
      "section",
      "borderRadius",
    )

  console.log("")
  console.log(
    "=== SECTION.borderRadius ===",
  )

  console.dir(
    radius,
    {
      depth: 10,
    },
  )

  const headingSize =
    getCapabilitySetting(
      "heading",
      "size",
    )

  console.log("")
  console.log(
    "=== HEADING.size ===",
  )

  console.dir(
    headingSize,
    {
      depth: 10,
    },
  )

  const buttonVariant =
    getCapabilitySetting(
      "ctaButton",
      "variant",
    )

  console.log("")
  console.log(
    "=== BUTTON.variant ===",
  )

  console.dir(
    buttonVariant,
    {
      depth: 10,
    },
  )

  console.log("")
  console.log(
    "=== VALIDATION ===",
  )

  console.log(
    "section.paddingY md:",
    isCapabilityValueAllowed(
      "section",
      "paddingY",
      "md",
    ),
  )

  console.log(
    "section.paddingY 7xl:",
    isCapabilityValueAllowed(
      "section",
      "paddingY",
      "7xl",
    ),
  )

  console.log(
    "heading.size 4xl:",
    isCapabilityValueAllowed(
      "heading",
      "size",
      "4xl",
    ),
  )

  console.log(
    "heading.size huge:",
    isCapabilityValueAllowed(
      "heading",
      "size",
      "huge",
    ),
  )

  console.log(
    "ctaButton.variant secondary:",
    isCapabilityValueAllowed(
      "ctaButton",
      "variant",
      "secondary",
    ),
  )

  console.log(
    "ctaButton.variant blue:",
    isCapabilityValueAllowed(
      "ctaButton",
      "variant",
      "blue",
    ),
  )

  if (
    !padding ||
    !radius ||
    !headingSize ||
    !buttonVariant
  ) {
    throw new Error(
      "No se encontraron capabilities esperadas.",
    )
  }

  if (
    !isCapabilityValueAllowed(
      "section",
      "paddingY",
      "md",
    )
  ) {
    throw new Error(
      "paddingY=md debería ser válido.",
    )
  }

  if (
    isCapabilityValueAllowed(
      "section",
      "paddingY",
      "7xl",
    )
  ) {
    throw new Error(
      "paddingY=7xl no debería ser válido.",
    )
  }

  if (
    !isCapabilityValueAllowed(
      "ctaButton",
      "variant",
      "secondary",
    )
  ) {
    throw new Error(
      "secondary debería ser una variante válida.",
    )
  }

  console.log("")
  console.log(
    "CAPABILITY SETTINGS VALIDADAS.",
  )
}

main().catch((error) => {
  console.error("")
  console.error(
    "CAPABILITY SETTINGS TEST ERROR:",
    error,
  )

  process.exit(1)
})
