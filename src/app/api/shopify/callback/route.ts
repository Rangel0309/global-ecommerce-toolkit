import { NextRequest, NextResponse } from "next/server";
import {
  SHOPIFY_API_VERSION,
  appUrl,
  encryptSecret,
  normalizeShopDomain,
  serviceSupabase,
  shopifyClientId,
  shopifyClientSecret,
  verifyShopifyCallbackHmac,
  verifyShopifyState,
} from "@/lib/shopify/server";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
};

export async function GET(request: NextRequest) {
  const fallback = new URL("/?shopify=error", appUrl());

  try {
    if (!verifyShopifyCallbackHmac(request.nextUrl)) {
      throw new Error("Invalid Shopify callback signature.");
    }

    const code = request.nextUrl.searchParams.get("code");
    const stateValue = request.nextUrl.searchParams.get("state");
    const shopParam = request.nextUrl.searchParams.get("shop");

    if (!code || !stateValue || !shopParam) {
      throw new Error("Missing Shopify OAuth parameters.");
    }

    const state = verifyShopifyState(stateValue);
    const shop = normalizeShopDomain(shopParam);

    if (shop !== state.shop) {
      throw new Error("Shop domain mismatch.");
    }

    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: shopifyClientId(),
          client_secret: shopifyClientSecret(),
          code,
          expiring: "1",
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      throw new Error(`Shopify token exchange failed: ${body}`);
    }

    const token = (await tokenResponse.json()) as TokenResponse;
    if (!token.access_token) throw new Error("Shopify did not return an access token.");

    const now = Date.now();
    const tokenExpiresAt = token.expires_in
      ? new Date(now + token.expires_in * 1000).toISOString()
      : null;
    const refreshTokenExpiresAt = token.refresh_token_expires_in
      ? new Date(now + token.refresh_token_expires_in * 1000).toISOString()
      : null;

    const db = serviceSupabase();

    const { error } = await db.from("shopify_connections").upsert(
      {
        user_id: state.userId,
        workspace_id: state.workspaceId,
        store_id: state.storeId,
        shop_domain: shop,
        access_token_encrypted: encryptSecret(token.access_token),
        refresh_token_encrypted: token.refresh_token
          ? encryptSecret(token.refresh_token)
          : null,
        token_expires_at: tokenExpiresAt,
        refresh_token_expires_at: refreshTokenExpiresAt,
        scopes: token.scope ?? null,
        api_version: SHOPIFY_API_VERSION,
        status: "connected",
        last_error: null,
      },
      { onConflict: "user_id,shop_domain" }
    );

    if (error) throw new Error(error.message);

    return NextResponse.redirect(
      new URL(`/?shopify=connected&shop=${encodeURIComponent(shop)}`, appUrl())
    );
  } catch (error) {
    fallback.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Shopify connection failed."
    );
    return NextResponse.redirect(fallback);
  }
}
