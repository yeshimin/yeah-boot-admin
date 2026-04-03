import { request } from '@/utils/request'
import type { CaptchaVo, LoginRequest, LoginVo } from '@/types/upms'

export function getCaptcha() {
  return request<CaptchaVo>({
    url: '/admin/auth/captcha',
    method: 'get',
    skipAuth: true,
  })
}

export function login(payload: LoginRequest) {
  return request<LoginVo>({
    url: '/admin/auth/login',
    method: 'post',
    data: payload,
    skipAuth: true,
  })
}

export function logout() {
  return request<void>({
    url: '/auth/logout',
    method: 'post',
  })
}
