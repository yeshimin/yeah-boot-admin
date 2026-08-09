export const RESOURCE_TYPE = {
  MENU: 1,
  PAGE: 2,
  BUTTON: 3,
  API: 4,
} as const

export function isMenuResourceType(type?: number | null) {
  return type === RESOURCE_TYPE.MENU || type === RESOURCE_TYPE.PAGE
}

export function isPageResourceType(type?: number | null) {
  return type === RESOURCE_TYPE.PAGE
}

export function isActionResourceType(type?: number | null) {
  return type === RESOURCE_TYPE.BUTTON || type === RESOURCE_TYPE.API
}
