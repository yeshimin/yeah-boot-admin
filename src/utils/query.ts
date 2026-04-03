export interface QueryCondition {
  field: string
  operator: string
  value: unknown
}

export function buildConditions(conditions: QueryCondition[]) {
  const parts = conditions
    .filter((condition) => condition.value !== undefined && condition.value !== null && condition.value !== '')
    .map((condition) => `${condition.field}:${condition.operator}:${String(condition.value)}`)

  return parts.length ? parts.join(';') : undefined
}
