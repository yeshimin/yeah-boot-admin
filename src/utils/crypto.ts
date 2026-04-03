export async function sha256Hex(value: string) {
  const input = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', input)
  const bytes = Array.from(new Uint8Array(hashBuffer))
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
