import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const SHOPIFY_API_VERSION = "2026-07";
export const SHOPIFY_SCOPES = "read_orders,read_products";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function normalizeShopDomain(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(cleaned)) {
    throw new Error("Use the store's .myshopify.com domain.");
  }

  return cleaned;
}

export async function verifySupabaseUser(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Authentication required.");
  }

  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: authorization,
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Invalid or expired session.");

  return (await response.json()) as { id: string; email?: string };
}

export function serviceSupabase() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function stateSignature(payload: string) {
  return crypto
    .createHmac("sha256", required("SHOPIFY_CLIENT_SECRET"))
    .update(payload)
    .digest("base64url");
}

export function createShopifyState(input: {
  userId: string;
  workspaceId: string;
  storeId: string;
  shop: string;
}) {
  const payload = Buffer.from(
    JSON.stringify({
      ...input,
      nonce: crypto.randomBytes(18).toString("base64url"),
      createdAt: Date.now(),
    })
  ).toString("base64url");

  return `${payload}.${stateSignature(payload)}`;
}

export function verifyShopifyState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state.");

  const expected = stateSignature(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new Error("Invalid OAuth state.");
  }

  const parsed = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8")
  ) as {
    userId: string;
    workspaceId: string;
    storeId: string;
    shop: string;
    nonce: string;
    createdAt: number;
  };

  if (Date.now() - parsed.createdAt > 15 * 60 * 1000) {
    throw new Error("OAuth state expired.");
  }

  return parsed;
}

export function verifyShopifyCallbackHmac(url: URL) {
  const received = url.searchParams.get("hmac");
  if (!received) return false;

  const params = new URLSearchParams(url.searchParams);
  params.delete("hmac");
  params.delete("signature");

  const message = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const digest = crypto
    .createHmac("sha256", required("SHOPIFY_CLIENT_SECRET"))
    .update(message)
    .digest("hex");

  return (
    received.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(digest))
  );
}

function encryptionKey() {
  const raw = required("SHOPIFY_TOKEN_ENCRYPTION_KEY");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("SHOPIFY_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value: string) {
  const [ivPart, tagPart, ciphertextPart] = value.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) {
    throw new Error("Invalid encrypted secret.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivPart, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function appUrl() {
  return required("APP_URL").replace(/\/$/, "");
}

export function shopifyClientId() {
  return required("SHOPIFY_CLIENT_ID");
}

export function shopifyClientSecret() {
  return required("SHOPIFY_CLIENT_SECRET");
}
