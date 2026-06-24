export function normalizeSearchValue(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
}

export function matchesSearch(query, values = []) {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) =>
    normalizeSearchValue(value).includes(normalizedQuery)
  )
}
