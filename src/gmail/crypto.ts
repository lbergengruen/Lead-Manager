import "server-only";

import crypto from "node:crypto";

import { env } from "@/env";

function getKey() {
  if (!env.oauthEncryptionKey) {
    throw new Error("OAUTH_ENCRYPTION_KEY is required");
  }

  const key = Buffer.from(env.oauthEncryptionKey, "base64");
  if (key.length !== 32) {
    throw new Error("OAUTH_ENCRYPTION_KEY must be 32 bytes base64");
  }

  return key;
}

export function encryptJson(value: unknown) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptJson<T>(ciphertextB64: string): T {
  const key = getKey();
  const buf = Buffer.from(ciphertextB64, "base64");

  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}
