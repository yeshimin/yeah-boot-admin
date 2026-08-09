import { getStoragePreviewUrl } from '@/api/storage'
import { resolveApiUrl } from './download'

export const DEFAULT_AVATAR_URL = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

export function normalizeAvatarValue(avatar?: string | null) {
  return avatar?.trim() || ''
}

export function resolveAvatarUrl(avatar?: string | null) {
  const avatarValue = normalizeAvatarValue(avatar)
  if (!avatarValue) {
    return ''
  }

  if (avatarValue.startsWith('http://') || avatarValue.startsWith('https://')) {
    return avatarValue
  }

  if (avatarValue.startsWith('/')) {
    return resolveApiUrl(avatarValue)
  }

  return getStoragePreviewUrl(avatarValue)
}
