import { NextRequest, NextResponse } from "next/server";
import {
  SHOPIFY_SCOPES,
  appUrl,
  createShopifyState,
  normalizeShopDomain,
  shopifyClientId,
  verifySupabaseUser,
} from "@/lib/shopify/server";

export async function POST(request: NextRequest) {
  try {
    const user = await verifySupabaseUser(request.headers.get("authorization"));
    const body = (await request.json()) as {
      shop?: string;
      workspaceId?: string;
      storeId?: string;
    };

    if (!body.shop || !body.workspaceId || !body.storeId) {
      return NextResponse.json(
        { error: "shop, workspaceId and storeId are required." },
        { status: 400 }
      );
    }

    const shop = normalizeShopDomain(body.shop);
    const state = createShopifyState({
      userId: user.id,
      workspaceId: body.workspaceId,
      storeId: body.storeId,
      shop,
    });

    const callbackUrl = `${appUrl()}/api/shopify/callback`;
    const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authorizeUrl.searchParams.set("client_id", shopifyClientId());
    authorizeUrl.searchParams.set("scope", SHOPIFY_SCOPES);
    authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
    authorizeUrl.searchParams.set("state", state);

    return NextResponse.json({ authorizeUrl: authorizeUrl.toString() });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to start Shopify connection.",
      },
      { status: 400 }
    );
  }
}
