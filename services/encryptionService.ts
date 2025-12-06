
// Simple wrapper for Web Crypto API to handle local encryption

const ALG = "AES-GCM";

const getKey = async () => {
  // In a real app, we'd derive this from a user password or store it in a secure enclave.
  // For this local-first MVP, we'll store a key in localStorage if not present, 
  // acknowledging that this protects against casual snooping but not root access.
  const storedKey = localStorage.getItem("pozimind_key");
  if (storedKey) {
    return importKey(storedKey);
  } else {
    const key = await window.crypto.subtle.generateKey(
      { name: ALG, length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    localStorage.setItem("pozimind_key", JSON.stringify(exported));
    return key;
  }
};

const importKey = async (jwkStr: string) => {
  const jwk = JSON.parse(jwkStr);
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: ALG },
    true,
    ["encrypt", "decrypt"]
  );
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
    binary += String.fromCharCode(bytes[i]);
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
