function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256Hex(value: string) {
  const input = new TextEncoder().encode(value)

  if (globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', input)
    return bytesToHex(new Uint8Array(hashBuffer))
  }

  // Web Crypto is unavailable for insecure LAN HTTP origins.
  const { sha256 } = await import('@noble/hashes/sha2.js')
  return bytesToHex(sha256(input))
}
