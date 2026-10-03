"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Status = {
  configured?: boolean;
  connected: boolean;
  shopDomain?: string;
  status?: string;
  lastSyncedAt?: string | null;
  lastError?: string | null;
  apiVersion?: string | null;
  error?: string;
};

export default function ShopifyConnector({
  workspaceId,
  storeId,
}: {
  workspaceId: string;
  storeId: string;
}) {
  const [shopDomain, setShopDomain] = useState("");
  const [status, setStatus] = useState<Status>({ connected: false });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessage("");
    void loadStatus();
  }, [storeId]);

  async function accessToken() {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sign in before connecting Shopify.");
    return token;
  }

  async function loadStatus() {
    try {
      const token = await accessToken();
      const response = await fetch(
        `/api/shopify/status?storeId=${encodeURIComponent(storeId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );
      const data = (await response.json()) as Status;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to load Shopify status.");
      }

      setStatus(data);
      if (data.shopDomain) setShopDomain(data.shopDomain);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load Shopify status."
      );
    }
  }

  async function connect() {
    setLoading(true);
    setMessage("");

    try {
      const token = await accessToken();
      const response = await fetch("/api/shopify/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop: shopDomain,
          workspaceId,
          storeId,
        }),
      });

      const data = (await response.json()) as {
        authorizeUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.authorizeUrl) {
        throw new Error(data.error || "Unable to start Shopify authorization.");
      }

      window.location.assign(data.authorizeUrl);
    } catch (error) {
      setLoading(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Shopify authorization."
      );
    }
  }

  async function sync() {
    setLoading(true);
    setMessage("");

    try {
      const token = await accessToken();
      const response = await fetch("/api/shopify/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storeId }),
      });

      const data = (await response.json()) as {
        ordersSynced?: number;
        daysSynced?: number;
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error || "Shopify sync failed.");
      }

      setMessage(
        `Synced ${data.ordersSynced ?? 0} orders across ${data.daysSynced ?? 0} days. Refreshing dashboard…`
      );
      await loadStatus();
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Shopify sync failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-300">Shopify</p>
          <h3 className="mt-1 text-lg font-semibold">
            {status.connected
            ? "Store connected"
            : status.configured === false
            ? "Shopify server setup pending"
            : "Connect store data"}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Import the last 60 days of orders, revenue and refunds into this
            store's operating dashboard. Ad spend and other manual costs remain
            untouched.
          </p>
        </div>

        {status.configured === false ? (
          <div className="max-w-sm rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200">
            Add the Shopify and server-only Supabase environment variables in
            Vercel before connecting a store.
          </div>
        ) : status.connected ? (
          <button
            onClick={sync}
            disabled={loading}
            className="rounded-xl bg-emerald-300 px-4 py-3 text-sm font-medium text-emerald-950 disabled:opacity-50"
          >
            {loading ? "Syncing…" : "Sync Shopify now"}
          </button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <input
              className="min-w-64 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
              value={shopDomain}
              onChange={(event) => setShopDomain(event.target.value)}
              placeholder="your-store.myshopify.com"
            />
            <button
              onClick={connect}
              disabled={loading || !shopDomain.trim()}
              className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Opening…" : "Connect Shopify"}
            </button>
          </div>
        )}
      </div>

      {status.connected && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
          <span>{status.shopDomain}</span>
          <span>API {status.apiVersion ?? "—"}</span>
          <span>
            Last sync:{" "}
            {status.lastSyncedAt
              ? new Date(status.lastSyncedAt).toLocaleString()
              : "never"}
          </span>
        </div>
      )}

      {(message || status.lastError) && (
        <p className="mt-4 text-xs text-slate-400">
          {message || status.lastError}
        </p>
      )}
    </div>
  );
}
