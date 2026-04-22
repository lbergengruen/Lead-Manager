import "server-only";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { oauthCredentials } from "@/db/schema";
import { env } from "@/env";
import { decryptJson, encryptJson } from "@/gmail/crypto";

const GOOGLE_PROVIDER = "google";

type StoredTokens = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
};

function assertGmailConfigured() {
  if (!env.gmailEnabled) {
    throw new Error("Gmail is disabled");
  }

  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new Error("Google OAuth env vars are required");
  }
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export async function isGoogleConnected() {
  const db = getDb();
  const row = await db
    .select({ id: oauthCredentials.id })
    .from(oauthCredentials)
    .where(eq(oauthCredentials.provider, GOOGLE_PROVIDER))
    .limit(1)
    .then((r) => r[0]);

  return Boolean(row);
}

export function buildGoogleAuthUrl(state: string) {
  assertGmailConfigured();

  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", env.googleClientId!);
  u.searchParams.set("redirect_uri", env.googleRedirectUri!);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set(
    "scope",
    [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email"
    ].join(" ")
  );
  u.searchParams.set("state", state);

  return u.toString();
}

export async function exchangeCodeForTokens(code: string) {
  assertGmailConfigured();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId!,
      client_secret: env.googleClientSecret!,
      redirect_uri: env.googleRedirectUri!,
      grant_type: "authorization_code"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
  };

  const tokens: StoredTokens = {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    scope: json.scope,
    token_type: json.token_type,
    expiry_date: Date.now() + json.expires_in * 1000
  };

  const db = getDb();
  const encryptedTokens = encryptJson(tokens);

  await db
    .insert(oauthCredentials)
    .values({
      provider: GOOGLE_PROVIDER,
      encryptedTokens
    })
    .onConflictDoUpdate({
      target: oauthCredentials.provider,
      set: {
        encryptedTokens,
        updatedAt: new Date()
      }
    });

  return tokens;
}

export async function disconnectGoogle() {
  const db = getDb();
  await db.delete(oauthCredentials).where(eq(oauthCredentials.provider, GOOGLE_PROVIDER));
}

export async function getStoredTokens(): Promise<StoredTokens | null> {
  const db = getDb();
  const row = await db
    .select({ encryptedTokens: oauthCredentials.encryptedTokens })
    .from(oauthCredentials)
    .where(eq(oauthCredentials.provider, GOOGLE_PROVIDER))
    .limit(1)
    .then((r) => r[0]);

  if (!row) return null;
  return decryptJson<StoredTokens>(row.encryptedTokens);
}

export async function refreshAccessToken(refreshToken: string) {
  assertGmailConfigured();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.googleClientId!,
      client_secret: env.googleClientSecret!,
      grant_type: "refresh_token"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };

  const tokens: StoredTokens = {
    access_token: json.access_token,
    scope: json.scope,
    token_type: json.token_type,
    expiry_date: Date.now() + json.expires_in * 1000
  };

  return tokens;
}

export async function getValidAccessToken() {
  const stored = await getStoredTokens();
  if (!stored) {
    throw new Error("Gmail is not connected");
  }

  if (stored.access_token && stored.expiry_date && stored.expiry_date > Date.now() + 60_000) {
    return stored.access_token;
  }

  if (!stored.refresh_token) {
    throw new Error("Missing refresh token");
  }

  const refreshed = await refreshAccessToken(stored.refresh_token);
  const merged: StoredTokens = {
    ...stored,
    ...refreshed
  };

  const db = getDb();
  await db
    .update(oauthCredentials)
    .set({
      encryptedTokens: encryptJson(merged),
      updatedAt: new Date()
    })
    .where(eq(oauthCredentials.provider, GOOGLE_PROVIDER));

  return merged.access_token!;
}

export function createStateToken() {
  return base64UrlEncode(crypto.randomBytes(24));
}
