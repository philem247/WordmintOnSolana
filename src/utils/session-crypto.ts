/**
 * Simple session encryption utilities
 * (For production, use more robust encryption)
 */

export function encryptSession(data: string): string {
  // Simple base64 encoding (for production, use proper encryption)
  return btoa(data);
}

export function decryptSession(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
}
