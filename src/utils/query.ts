export interface QueryCondition {
  field: string
  operator: string
  value: unknown
}

function normalizeConditionValue(value: unknown) {
  if (value === true || value === 'true') {
    return '1'
  }
  if (value === false || value === 'false') {
    return '0'
  }
  return String(value)
}

export function buildConditions(conditions: QueryCondition[]) {
  const parts = conditions
    .filter((condition) => condition.value !== undefined && condition.value !== null && condition.value !== '')
    .map((condition) => `${condition.field}:${condition.operator}:${normalizeConditionValue(condition.value)}`)

  return parts.length ? parts.join(';') : undefined
}
