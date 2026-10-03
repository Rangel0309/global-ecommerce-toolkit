import { NextRequest, NextResponse } from "next/server";
import {
  serviceSupabase,
  verifySupabaseUser,
} from "@/lib/shopify/server";

function isConfigured() {
  return [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_URL",
    "SHOPIFY_CLIENT_ID",
    "SHOPIFY_CLIENT_SECRET",
    "SHOPIFY_TOKEN_ENCRYPTION_KEY",
  ].every((name) => Boolean(process.env[name]));
}

export async function GET(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      missingServerConfiguration: true,
    });
  }

  try {
    const user = await verifySupabaseUser(request.headers.get("authorization"));
    const storeId = request.nextUrl.searchParams.get("storeId");

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required." }, { status: 400 });
    }

    const db = serviceSupabase();
    const { data, error } = await db
      .from("shopify_connections")
      .select(
        "shop_domain,status,last_synced_at,last_error,scopes,api_version"
      )
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .neq("status", "revoked")
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json({ configured: true, connected: false });
    }

    return NextResponse.json({
      configured: true,
      connected: data.status === "connected",
      shopDomain: data.shop_domain,
      status: data.status,
      lastSyncedAt: data.last_synced_at,
      lastError: data.last_error,
      scopes: data.scopes,
      apiVersion: data.api_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        error:
          error instanceof Error
            ? error.message
            : "Unable to read Shopify connection.",
      },
      { status: 400 }
    );
  }
}
