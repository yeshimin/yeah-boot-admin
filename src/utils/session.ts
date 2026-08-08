type UnauthorizedHandler = (message?: string) => void | Promise<void>

let unauthorizedHandler: UnauthorizedHandler | null = null
let unauthorizedPromise: Promise<void> | null = null
let unauthorizedHandled = false

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export function resetUnauthorizedState() {
  unauthorizedHandled = false
  unauthorizedPromise = null
}

export function handleUnauthorized(message?: string) {
  if (unauthorizedHandled) {
    return unauthorizedPromise || Promise.resolve()
  }

  unauthorizedHandled = true
  unauthorizedPromise = Promise.resolve(unauthorizedHandler?.(message)).finally(() => {
    unauthorizedPromise = null
  })

  return unauthorizedPromise
}
