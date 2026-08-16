export const DATA_STATUS_DISABLED = '2'
export const DISABLED_SUFFIX = '（禁用）'

export type NameStatusLike = {
  name?: string | null
  status?: string | null
} | null | undefined

export function isDisabledStatus(status?: string | null) {
  return status === DATA_STATUS_DISABLED
}

export function formatDisabledName(name?: string | null, status?: string | null) {
  const displayName = name || ''
  if (!displayName) {
    return '-'
  }

  return isDisabledStatus(status) ? `${displayName}${DISABLED_SUFFIX}` : displayName
}

export function joinStatusNames(items?: NameStatusLike[]) {
  const names = items
    ?.map((item) => formatDisabledName(item?.name, item?.status))
    .filter((name) => name !== '-')

  return names?.length ? names.join('、') : '-'
}
