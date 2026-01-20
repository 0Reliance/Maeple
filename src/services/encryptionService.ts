/**
 * MAEPLE Encryption Service
 * 
 * Provides AES-GCM 256-bit encryption for sensitive biometric data.
 * 
 * SECURITY CONSIDERATIONS:
 * ========================
 * Current implementation stores the encryption key in localStorage.
 * This provides protection against:
 * - Casual observers looking at localStorage directly
 * - Data at rest (if device is stolen but not unlocked)
 * 
 * This does NOT protect against:
 * - XSS attacks (JavaScript can read localStorage)
 * - Root/admin access to the device
 * - Browser extensions with storage permissions
 * 
 * FUTURE IMPROVEMENTS (TODO):
 * 1. Use Web Authentication API (WebAuthn) for key derivation from biometrics
 * 2. On mobile (Capacitor): Use platform secure storage (iOS Keychain / Android Keystore)
 * 3. Implement password-based key derivation (PBKDF2) for user-derived keys
 * 4. Consider IndexedDB with encryption-at-rest on supported browsers
 * 
 * For production with highly sensitive data, consider:
 * - Server-side encryption with user-held keys
 * - Hardware security modules (HSM) integration
 * - Zero-knowledge proof systems
 */

const ALG = "AES-GCM";
const STORAGE_KEY = "maeple_key";

/**
 * Get or create the encryption key
 * 
 * WARNING: Key is stored in localStorage which is accessible to JavaScript.
 * See security considerations above.
 */
const getKey = async (): Promise<CryptoKey> => {
  const storedKey = localStorage.getItem(STORAGE_KEY);
  if (storedKey) {
    return importKey(storedKey);
  } else {
    const key = await window.crypto.subtle.generateKey(
      { name: ALG, length: 256 },
      true, // extractable - needed for export/import
      ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exported));
    return key;
  }
};

/**
 * Import a JWK key from string
 */
const importKey = async (jwkStr: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkStr);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: ALG },
    true,
    ["encrypt", "decrypt"]
  );
};

/**
 * Check if encryption key exists (useful for migration/reset scenarios)
 */
export const hasEncryptionKey = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Reset encryption key (WARNING: existing encrypted data will be unrecoverable)
 */
export const resetEncryptionKey = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  // Generate new key on next getKey() call
  await getKey();
};

export const encryptData = async (data: unknown): Promise<{ cipher: string; iv: string }> => {
  const key = await getKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALG, iv },
    key,
    encoded
  );

  return {
    cipher: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
};

export const decryptData = async (cipher: string, iv: string): Promise<unknown> => {
  try {
    const key = await getKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALG, iv: base64ToArrayBuffer(iv) },
      key,
      base64ToArrayBuffer(cipher)
    );
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
};

// Utilities
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string) => {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};
