import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase, verifySupabaseUser } from "@/lib/shopify/server";
import { syncShopifyConnection } from "@/lib/shopify/sync";

export async function POST(request: NextRequest) {
  try {
    const user = await verifySupabaseUser(request.headers.get("authorization"));
    const body = (await request.json()) as { storeId?: string };

    if (!body.storeId) {
      return NextResponse.json({ error: "storeId is required." }, { status: 400 });
    }

    const db = serviceSupabase();
    const { data: connection, error } = await db
      .from("shopify_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_id", body.storeId)
      .eq("status", "connected")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!connection?.id) {
      throw new Error("No connected Shopify store was found.");
    }

    const result = await syncShopifyConnection(connection.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Shopify sync failed.",
      },
      { status: 400 }
    );
  }
}
