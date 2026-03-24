import { EncryptedData } from '@notes-app/shared';

const ENCRYPTION_KEY_STORAGE = 'notes-app-encryption-key';

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToBuffer(keyString);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export function getStoredKey(): string | null {
  return localStorage.getItem(ENCRYPTION_KEY_STORAGE);
}

export function storeKey(key: string): void {
  localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
}

export function clearStoredKey(): void {
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE);
}

export async function encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encoder.encode(data)
  );

  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
  };
}

export async function decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);
  const iv = base64ToBuffer(encryptedData.iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    ciphertext
  );

  return decoder.decode(decrypted);
}

export async function initializeEncryption(): Promise<CryptoKey> {
  const storedKey = getStoredKey();
  
  if (storedKey) {
    return await importKey(storedKey);
  }
  
  const newKey = await generateEncryptionKey();
  const exportedKey = await exportKey(newKey);
  storeKey(exportedKey);
  
  return newKey;
}

export async function resetEncryption(): Promise<CryptoKey> {
  clearStoredKey();
  return await initializeEncryption();
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint32Array(32);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars[array[i] % chars.length];
  }
  
  return password;
}

export async function encryptNote(note: { title: string; content: string }, key: CryptoKey): Promise<{ encryptedTitle: EncryptedData; encryptedContent: EncryptedData }> {
  const [encryptedTitle, encryptedContent] = await Promise.all([
    encrypt(note.title, key),
    encrypt(note.content, key),
  ]);
  
  return { encryptedTitle, encryptedContent };
}

export async function decryptNote(
  encryptedTitle: EncryptedData,
  encryptedContent: EncryptedData,
  key: CryptoKey
): Promise<{ title: string; content: string }> {
  const [title, content] = await Promise.all([
    decrypt(encryptedTitle, key),
    decrypt(encryptedContent, key),
  ]);
  
  return { title, content };
}
