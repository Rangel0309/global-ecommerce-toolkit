import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/shopify/server";
import { syncShopifyConnection } from "@/lib/shopify/sync";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceSupabase();
  const { data: connections, error } = await db
    .from("shopify_connections")
    .select("id,shop_domain")
    .eq("status", "connected")
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    id: string;
    shop: string;
    ok: boolean;
    ordersSynced?: number;
    error?: string;
  }> = [];

  for (const connection of connections ?? []) {
    try {
      const result = await syncShopifyConnection(connection.id);
      results.push({
        id: connection.id,
        shop: connection.shop_domain,
        ok: true,
        ordersSynced: result.ordersSynced,
      });
    } catch (error) {
      results.push({
        id: connection.id,
        shop: connection.shop_domain,
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed.",
      });
    }
  }

  return NextResponse.json({
    ok: results.every((item) => item.ok),
    processed: results.length,
    results,
  });
}
