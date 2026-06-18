export function normalizeRelation<T>(
  value: T | T[] | null | undefined,
): T | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) return value[0]
  return value
}
