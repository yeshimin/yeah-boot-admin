interface ErrorResponseLike {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
}

export function getRequestErrorMessage(error: unknown) {
  const errorResponse = error as ErrorResponseLike | undefined
  const responseMessage = errorResponse?.response?.data?.message
  if (responseMessage) {
    return responseMessage
  }

  const responseStatus = errorResponse?.response?.status
  if (responseStatus) {
    return `系统接口 ${responseStatus} 异常`
  }

  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return '后端接口连接异常'
    }
    if (error.message.includes('timeout')) {
      return '系统接口请求超时'
    }
    return error.message
  }

  return typeof error === 'string' ? error : ''
}

export function isUserCancel(error: unknown) {
  return error === 'cancel' || error === 'close'
}
