export function mergeDashboardViewQuery(
  input: { toString(): string } | null | undefined,
  keysToReplace: string[],
  nextQuery: string
): string {
  const params = new URLSearchParams(input?.toString() ?? "")

  for (const key of keysToReplace) {
    params.delete(key)
  }

  const nextParams = new URLSearchParams(nextQuery)
  nextParams.forEach((value, key) => {
    params.set(key, value)
  })

  return params.toString()
}
