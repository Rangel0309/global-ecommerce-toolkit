import {
  SHOPIFY_API_VERSION,
  decryptSecret,
  encryptSecret,
  serviceSupabase,
  shopifyClientId,
  shopifyClientSecret,
} from "@/lib/shopify/server";

export type ShopifyConnection = {
  id: string;
  user_id: string;
  workspace_id: string;
  store_id: string;
  shop_domain: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

type ShopifyOrder = {
  id: string;
  createdAt: string;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  totalRefundedSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
};

async function refreshIfNeeded(connection: ShopifyConnection) {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : null;

  if (!expiresAt || expiresAt - Date.now() > 5 * 60 * 1000) {
    return {
      accessToken: decryptSecret(connection.access_token_encrypted),
      updates: null as null | Record<string, unknown>,
    };
  }

  if (!connection.refresh_token_encrypted) {
    throw new Error("Shopify authorization expired. Reconnect the store.");
  }

  const response = await fetch(
    `https://${connection.shop_domain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: shopifyClientId(),
        client_secret: shopifyClientSecret(),
        refresh_token: decryptSecret(connection.refresh_token_encrypted),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Shopify authorization expired. Reconnect the store."
        : `Shopify token refresh failed with ${response.status}.`
    );
  }

  const token = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_token_expires_in?: number;
    scope?: string;
  };

  return {
    accessToken: token.access_token,
    updates: {
      access_token_encrypted: encryptSecret(token.access_token),
      refresh_token_encrypted: encryptSecret(token.refresh_token),
      token_expires_at: new Date(
        Date.now() + token.expires_in * 1000
      ).toISOString(),
      refresh_token_expires_at: token.refresh_token_expires_in
        ? new Date(
            Date.now() + token.refresh_token_expires_in * 1000
          ).toISOString()
        : null,
      scopes: token.scope ?? null,
    },
  };
}

async function fetchRecentOrders(shop: string, accessToken: string) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 59);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const query = `
    query OrdersForMetrics($cursor: String, $query: String!) {
      shop {
        currencyCode
      }
      orders(
        first: 100
        after: $cursor
        query: $query
        sortKey: CREATED_AT
        reverse: false
      ) {
        nodes {
          id
          createdAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalRefundedSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const orders: ShopifyOrder[] = [];
  let currencyCode = "";
  let cursor: string | null = null;

  for (let page = 0; page < 50; page += 1) {
    const response = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query,
          variables: {
            cursor,
            query: `created_at:>=${cutoffDate}`,
          },
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify Admin API returned ${response.status}.`);
    }

    const json = (await response.json()) as {
      data?: {
        shop?: { currencyCode: string };
        orders?: {
          nodes: ShopifyOrder[];
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(json.errors.map((item) => item.message).join("; "));
    }

    const connection = json.data?.orders;
    if (!connection) throw new Error("Shopify orders response was incomplete.");

    currencyCode = json.data?.shop?.currencyCode ?? currencyCode;
    orders.push(...connection.nodes);

    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) {
      break;
    }

    cursor = connection.pageInfo.endCursor;
  }

  return { orders, currencyCode };
}

export async function syncShopifyConnection(connectionId: string) {
  const db = serviceSupabase();
  let syncRunId: string | null = null;

  try {
    const { data: connection, error } = await db
      .from("shopify_connections")
      .select(
        "id,user_id,workspace_id,store_id,shop_domain,access_token_encrypted,refresh_token_encrypted,token_expires_at"
      )
      .eq("id", connectionId)
      .eq("status", "connected")
      .single();

    if (error) throw new Error(error.message);
    if (!connection?.access_token_encrypted) {
      throw new Error("No connected Shopify store was found.");
    }

    const { data: syncRun, error: runError } = await db
      .from("shopify_sync_runs")
      .insert({
        connection_id: connection.id,
        user_id: connection.user_id,
        status: "running",
      })
      .select("id")
      .single();

    if (runError) throw new Error(runError.message);
    syncRunId = syncRun.id;

    const auth = await refreshIfNeeded(connection as ShopifyConnection);

    if (auth.updates) {
      const { error: tokenError } = await db
        .from("shopify_connections")
        .update(auth.updates)
        .eq("id", connection.id);

      if (tokenError) throw new Error(tokenError.message);
    }

    const { orders, currencyCode } = await fetchRecentOrders(
      connection.shop_domain,
      auth.accessToken
    );

    const supportedCurrencies = new Set(["USD", "EUR", "GBP"]);
    if (currencyCode && !supportedCurrencies.has(currencyCode)) {
      throw new Error(
        `Shop currency ${currencyCode} is not supported by this toolkit yet.`
      );
    }

    const grouped = new Map<
      string,
      { revenue: number; orders: number; refunds: number }
    >();

    for (const order of orders) {
      const date = order.createdAt.slice(0, 10);
      const current = grouped.get(date) ?? {
        revenue: 0,
        orders: 0,
        refunds: 0,
      };

      current.revenue += Number(order.totalPriceSet.shopMoney.amount || 0);
      current.refunds += Number(order.totalRefundedSet.shopMoney.amount || 0);
      current.orders += 1;
      grouped.set(date, current);
    }

    const dates = [...grouped.keys()];
    const existingByDate = new Map<string, Record<string, unknown>>();

    if (dates.length) {
      const { data: existing, error: existingError } = await db
        .from("daily_metrics")
        .select("metric_date,ad_spend,cogs,fees,other_costs,notes")
        .eq("user_id", connection.user_id)
        .eq("store_id", connection.store_id)
        .in("metric_date", dates);

      if (existingError) throw new Error(existingError.message);

      for (const item of existing ?? []) {
        existingByDate.set(String(item.metric_date), item);
      }
    }

    const rows = dates.map((date) => {
      const imported = grouped.get(date)!;
      const existing = existingByDate.get(date);

      return {
        user_id: connection.user_id,
        workspace_id: connection.workspace_id,
        store_id: connection.store_id,
        metric_date: date,
        revenue: Number(imported.revenue.toFixed(2)),
        orders: imported.orders,
        refunds: Number(imported.refunds.toFixed(2)),
        ad_spend: Number(existing?.ad_spend ?? 0),
        cogs: Number(existing?.cogs ?? 0),
        fees: Number(existing?.fees ?? 0),
        other_costs: Number(existing?.other_costs ?? 0),
        notes: existing?.notes ?? null,
      };
    });

    if (rows.length) {
      const { error: upsertError } = await db
        .from("daily_metrics")
        .upsert(rows, { onConflict: "store_id,metric_date" });

      if (upsertError) throw new Error(upsertError.message);
    }

    if (currencyCode) {
      const { error: storeError } = await db
        .from("stores")
        .update({ currency: currencyCode })
        .eq("id", connection.store_id)
        .eq("user_id", connection.user_id);

      if (storeError) throw new Error(storeError.message);
    }

    const completedAt = new Date().toISOString();

    const { error: connectionUpdateError } = await db
      .from("shopify_connections")
      .update({
        last_synced_at: completedAt,
        last_error: null,
        status: "connected",
      })
      .eq("id", connection.id);

    if (connectionUpdateError) throw new Error(connectionUpdateError.message);

    if (syncRunId) {
      await db
        .from("shopify_sync_runs")
        .update({
          finished_at: completedAt,
          status: "success",
          days_synced: rows.length,
          orders_synced: orders.length,
          error_message: null,
        })
        .eq("id", syncRunId);
    }

    return {
      ok: true,
      connectionId: connection.id,
      userId: connection.user_id,
      storeId: connection.store_id,
      shop: connection.shop_domain,
      currency: currencyCode || null,
      ordersSynced: orders.length,
      daysSynced: rows.length,
      lastSyncedAt: completedAt,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shopify sync failed.";

    if (syncRunId) {
      await db
        .from("shopify_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          error_message: message,
        })
        .eq("id", syncRunId);
    }

    await db
      .from("shopify_connections")
      .update({ last_error: message })
      .eq("id", connectionId);

    throw new Error(message);
  }
}
