"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Currency = "USD" | "EUR" | "GBP";

type Store = {
  id: string;
  name: string;
  country_code: string;
  currency: Currency;
  platform: string;
  status: "active" | "paused" | "archived";
};

type DailyMetric = {
  id: string;
  metric_date: string;
  revenue: number;
  orders: number;
  ad_spend: number;
  cogs: number;
  fees: number;
  refunds: number;
  other_costs: number;
  notes: string | null;
};

type Props = {
  userId: string;
  workspaceId: string;
};

const storePresets = [
  { country: "US", label: "United States", currency: "USD" as Currency },
  { country: "GB", label: "United Kingdom", currency: "GBP" as Currency },
  { country: "DE", label: "Germany", currency: "EUR" as Currency },
];

function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function money(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none focus:border-blue-400/50"
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function OperationsDashboard({ userId, workspaceId }: Props) {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const [storeName, setStoreName] = useState("Main Store");
  const [storePreset, setStorePreset] = useState("US");
  const [storeMessage, setStoreMessage] = useState("");
  const [storeBusy, setStoreBusy] = useState(false);

  const [entryId, setEntryId] = useState<string | null>(null);
  const [metricDate, setMetricDate] = useState(todayString());
  const [revenue, setRevenue] = useState(0);
  const [orders, setOrders] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [fees, setFees] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [notes, setNotes] = useState("");
  const [entryMessage, setEntryMessage] = useState("");
  const [entryBusy, setEntryBusy] = useState(false);

  const selectedStore = stores.find((item) => item.id === selectedStoreId) ?? null;
  const currency = selectedStore?.currency ?? "USD";

  useEffect(() => {
    void loadStores();
  }, [workspaceId]);

  useEffect(() => {
    if (selectedStoreId) {
      void loadMetrics(selectedStoreId);
    } else {
      setMetrics([]);
    }
  }, [selectedStoreId]);

  async function loadStores() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("stores")
      .select("id,name,country_code,currency,platform,status")
      .eq("workspace_id", workspaceId)
      .neq("status", "archived")
      .order("created_at", { ascending: true });

    if (error) {
      setStoreMessage(error.message);
      return;
    }

    const nextStores = (data ?? []) as Store[];
    setStores(nextStores);

    if (!selectedStoreId && nextStores[0]) {
      setSelectedStoreId(nextStores[0].id);
    } else if (
      selectedStoreId &&
      !nextStores.some((item) => item.id === selectedStoreId)
    ) {
      setSelectedStoreId(nextStores[0]?.id ?? "");
    }
  }

  async function loadMetrics(storeId: string) {
    if (!supabase) return;

    const since = new Date();
    since.setDate(since.getDate() - 60);
    const sinceString = since.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("daily_metrics")
      .select(
        "id,metric_date,revenue,orders,ad_spend,cogs,fees,refunds,other_costs,notes"
      )
      .eq("store_id", storeId)
      .gte("metric_date", sinceString)
      .order("metric_date", { ascending: false });

    if (error) {
      setEntryMessage(error.message);
      return;
    }

    setMetrics((data ?? []) as DailyMetric[]);
  }

  async function createStore() {
    if (!supabase) return;

    const preset =
      storePresets.find((item) => item.country === storePreset) ??
      storePresets[0];

    setStoreBusy(true);
    setStoreMessage("");

    const { data, error } = await supabase
      .from("stores")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        name: storeName.trim() || preset.label,
        country_code: preset.country,
        currency: preset.currency,
        platform: "Shopify",
        status: "active",
      })
      .select("id,name,country_code,currency,platform,status")
      .single();

    setStoreBusy(false);

    if (error) {
      setStoreMessage(error.message);
      return;
    }

    setStoreMessage("Store created.");
    setStoreName("Main Store");
    await loadStores();
    if (data?.id) setSelectedStoreId(String(data.id));
  }

  function clearEntryForm() {
    setEntryId(null);
    setMetricDate(todayString());
    setRevenue(0);
    setOrders(0);
    setAdSpend(0);
    setCogs(0);
    setFees(0);
    setRefunds(0);
    setOtherCosts(0);
    setNotes("");
    setEntryMessage("");
  }

  function editEntry(item: DailyMetric) {
    setEntryId(item.id);
    setMetricDate(item.metric_date);
    setRevenue(Number(item.revenue));
    setOrders(Number(item.orders));
    setAdSpend(Number(item.ad_spend));
    setCogs(Number(item.cogs));
    setFees(Number(item.fees));
    setRefunds(Number(item.refunds));
    setOtherCosts(Number(item.other_costs));
    setNotes(item.notes ?? "");
    setEntryMessage("Editing saved day.");
  }

  async function saveEntry() {
    if (!supabase || !selectedStore) {
      setEntryMessage("Create or select a store first.");
      return;
    }

    setEntryBusy(true);
    setEntryMessage("");

    const payload = {
      user_id: userId,
      workspace_id: workspaceId,
      store_id: selectedStore.id,
      metric_date: metricDate,
      revenue,
      orders: Math.max(0, Math.round(orders)),
      ad_spend: adSpend,
      cogs,
      fees,
      refunds,
      other_costs: otherCosts,
      notes: notes.trim() || null,
    };

    const { error } = entryId
      ? await supabase.from("daily_metrics").update(payload).eq("id", entryId)
      : await supabase
          .from("daily_metrics")
          .upsert(payload, { onConflict: "store_id,metric_date" });

    setEntryBusy(false);

    if (error) {
      setEntryMessage(error.message);
      return;
    }

    setEntryMessage(entryId ? "Day updated." : "Daily metrics saved.");
    await loadMetrics(selectedStore.id);
    setEntryId(null);
  }

  async function deleteEntry(item: DailyMetric) {
    if (!supabase || !selectedStore) return;

    const confirmed = window.confirm(
      `Delete metrics for ${item.metric_date}?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("daily_metrics")
      .delete()
      .eq("id", item.id);

    if (error) {
      setEntryMessage(error.message);
      return;
    }

    if (entryId === item.id) clearEntryForm();
    await loadMetrics(selectedStore.id);
  }

  const visibleMetrics = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (range - 1));
    const cutoffString = cutoff.toISOString().slice(0, 10);
    return metrics.filter((item) => item.metric_date >= cutoffString);
  }, [metrics, range]);

  const summary = useMemo(() => {
    const totals = visibleMetrics.reduce(
      (acc, item) => {
        acc.revenue += Number(item.revenue);
        acc.orders += Number(item.orders);
        acc.adSpend += Number(item.ad_spend);
        acc.cogs += Number(item.cogs);
        acc.fees += Number(item.fees);
        acc.refunds += Number(item.refunds);
        acc.otherCosts += Number(item.other_costs);
        return acc;
      },
      {
        revenue: 0,
        orders: 0,
        adSpend: 0,
        cogs: 0,
        fees: 0,
        refunds: 0,
        otherCosts: 0,
      }
    );

    const profit =
      totals.revenue -
      totals.adSpend -
      totals.cogs -
      totals.fees -
      totals.refunds -
      totals.otherCosts;

    return {
      ...totals,
      profit,
      margin: totals.revenue > 0 ? (profit / totals.revenue) * 100 : 0,
      roas: totals.adSpend > 0 ? totals.revenue / totals.adSpend : 0,
      cpa: totals.orders > 0 ? totals.adSpend / totals.orders : 0,
      aov: totals.orders > 0 ? totals.revenue / totals.orders : 0,
    };
  }, [visibleMetrics]);

  const chartData = useMemo(
    () =>
      [...visibleMetrics]
        .sort((a, b) => a.metric_date.localeCompare(b.metric_date))
        .slice(-14)
        .map((item) => ({
          ...item,
          profit:
            Number(item.revenue) -
            Number(item.ad_spend) -
            Number(item.cogs) -
            Number(item.fees) -
            Number(item.refunds) -
            Number(item.other_costs),
        })),
    [visibleMetrics]
  );

  const maxChart = Math.max(
    1,
    ...chartData.flatMap((item) => [
      Number(item.revenue),
      Number(item.ad_spend),
      Math.max(0, Number(item.profit)),
    ])
  );

  function exportOperationsCsv() {
    if (!selectedStore || visibleMetrics.length === 0) {
      setEntryMessage("Add daily metrics before exporting.");
      return;
    }

    const headers = [
      "date",
      "revenue",
      "orders",
      "ad_spend",
      "cogs",
      "fees",
      "refunds",
      "other_costs",
      "profit",
      "roas",
      "notes",
    ];

    const rows = visibleMetrics
      .slice()
      .sort((a, b) => a.metric_date.localeCompare(b.metric_date))
      .map((item) => {
        const profit =
          Number(item.revenue) -
          Number(item.ad_spend) -
          Number(item.cogs) -
          Number(item.fees) -
          Number(item.refunds) -
          Number(item.other_costs);
        const roas =
          Number(item.ad_spend) > 0
            ? Number(item.revenue) / Number(item.ad_spend)
            : 0;

        return [
          item.metric_date,
          item.revenue,
          item.orders,
          item.ad_spend,
          item.cogs,
          item.fees,
          item.refunds,
          item.other_costs,
          profit,
          roas,
          item.notes ?? "",
        ];
      });

    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCell(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeStore =
      selectedStore.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "store";
    link.href = url;
    link.download = `${safeStore}-operations-${range}d.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="border-b border-white/10 py-10">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-300">Operations</p>
          <h2 className="mt-2 text-2xl font-semibold">Store performance</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track revenue, ad spend, orders, product costs and profit per store.
            Manual entry is the first layer; platform integrations can replace it later.
          </p>
        </div>

        {stores.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
              value={selectedStoreId}
              onChange={(event) => {
                setSelectedStoreId(event.target.value);
                clearEntryForm();
              }}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} · {store.country_code} · {store.currency}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm outline-none"
              value={range}
              onChange={(event) =>
                setRange(Number(event.target.value) as 7 | 14 | 30)
              }
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>

            <button
              onClick={exportOperationsCsv}
              className="rounded-xl border border-white/10 px-3 py-3 text-sm hover:bg-white/[0.05]"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_160px] lg:items-end">
          <label className="grid gap-2 text-sm text-slate-300">
            Store name
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="e.g. US Store"
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Market
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 outline-none"
              value={storePreset}
              onChange={(event) => setStorePreset(event.target.value)}
            >
              {storePresets.map((item) => (
                <option key={item.country} value={item.country}>
                  {item.label} · {item.currency}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={createStore}
            disabled={storeBusy}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-200 disabled:opacity-50"
          >
            {storeBusy ? "Creating..." : "Add store"}
          </button>
        </div>
        {storeMessage && (
          <p className="mt-3 text-xs text-slate-400">{storeMessage}</p>
        )}
      </div>

      {selectedStore ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={money(summary.revenue, currency)}
              helper={`${summary.orders} orders in selected period`}
            />
            <MetricCard
              label="Profit"
              value={money(summary.profit, currency)}
              helper={`${summary.margin.toFixed(1)}% net margin`}
            />
            <MetricCard
              label="ROAS"
              value={summary.roas.toFixed(2)}
              helper={`Ad spend: ${money(summary.adSpend, currency)}`}
            />
            <MetricCard
              label="CPA / AOV"
              value={money(summary.cpa, currency)}
              helper={`AOV: ${money(summary.aov, currency)}`}
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-300">
                    Daily entry
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {entryId ? "Edit operating day" : "Add operating day"}
                  </h3>
                </div>
                {entryId && (
                  <button
                    onClick={clearEntryForm}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  Date
                  <input
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
                    type="date"
                    value={metricDate}
                    onChange={(event) => setMetricDate(event.target.value)}
                  />
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  Orders
                  <input
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
                    type="number"
                    min="0"
                    step="1"
                    value={orders}
                    onChange={(event) => setOrders(Number(event.target.value))}
                  />
                </label>

                <Field label="Revenue" value={revenue} onChange={setRevenue} />
                <Field label="Ad spend" value={adSpend} onChange={setAdSpend} />
                <Field label="COGS" value={cogs} onChange={setCogs} />
                <Field label="Fees" value={fees} onChange={setFees} />
                <Field label="Refunds" value={refunds} onChange={setRefunds} />
                <Field
                  label="Other costs"
                  value={otherCosts}
                  onChange={setOtherCosts}
                />
              </div>

              <label className="mt-4 grid gap-2 text-sm text-slate-300">
                Notes
                <textarea
                  className="min-h-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Creative changes, campaign notes, supplier issue..."
                />
              </label>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={saveEntry}
                  disabled={entryBusy}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-50"
                >
                  {entryBusy
                    ? "Saving..."
                    : entryId
                    ? "Update day"
                    : "Save day"}
                </button>
                {entryMessage && (
                  <p className="text-sm text-slate-400">{entryMessage}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-5">
                <p className="text-sm font-medium text-violet-300">
                  Revenue · Profit · Ad spend
                </p>
                <h3 className="mt-1 text-lg font-semibold">Daily trend</h3>
              </div>

              {chartData.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                  Add daily metrics to build the trend.
                </div>
              ) : (
                <div className="grid gap-4">
                  {chartData.map((item) => (
                    <div key={item.id} className="grid gap-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.metric_date.slice(5)}</span>
                        <span>{money(Number(item.revenue), currency)}</span>
                      </div>
                      <div className="grid gap-1">
                        <div
                          className="h-2 rounded-full bg-blue-400/70"
                          style={{
                            width: `${Math.max(
                              2,
                              (Number(item.revenue) / maxChart) * 100
                            )}%`,
                          }}
                          title={`Revenue: ${money(
                            Number(item.revenue),
                            currency
                          )}`}
                        />
                        <div
                          className="h-2 rounded-full bg-emerald-400/70"
                          style={{
                            width: `${Math.max(
                              2,
                              (Math.max(0, Number(item.profit)) / maxChart) * 100
                            )}%`,
                          }}
                          title={`Profit: ${money(
                            Number(item.profit),
                            currency
                          )}`}
                        />
                        <div
                          className="h-2 rounded-full bg-fuchsia-400/70"
                          style={{
                            width: `${Math.max(
                              2,
                              (Number(item.ad_spend) / maxChart) * 100
                            )}%`,
                          }}
                          title={`Ad spend: ${money(
                            Number(item.ad_spend),
                            currency
                          )}`}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Blue: Revenue</span>
                    <span>Green: Profit</span>
                    <span>Purple: Ad spend</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="mb-5">
              <p className="text-sm font-medium text-amber-300">History</p>
              <h3 className="mt-1 text-lg font-semibold">Recent operating days</h3>
            </div>

            {metrics.length === 0 ? (
              <p className="text-sm text-slate-500">No daily entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Revenue</th>
                      <th className="pb-3 pr-4 font-medium">Orders</th>
                      <th className="pb-3 pr-4 font-medium">Ad spend</th>
                      <th className="pb-3 pr-4 font-medium">Profit</th>
                      <th className="pb-3 pr-4 font-medium">ROAS</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slice(0, 15).map((item) => {
                      const profit =
                        Number(item.revenue) -
                        Number(item.ad_spend) -
                        Number(item.cogs) -
                        Number(item.fees) -
                        Number(item.refunds) -
                        Number(item.other_costs);
                      const roas =
                        Number(item.ad_spend) > 0
                          ? Number(item.revenue) / Number(item.ad_spend)
                          : 0;

                      return (
                        <tr key={item.id} className="border-t border-white/5">
                          <td className="py-3 pr-4">{item.metric_date}</td>
                          <td className="py-3 pr-4">
                            {money(Number(item.revenue), currency)}
                          </td>
                          <td className="py-3 pr-4">{item.orders}</td>
                          <td className="py-3 pr-4">
                            {money(Number(item.ad_spend), currency)}
                          </td>
                          <td className="py-3 pr-4">
                            {money(profit, currency)}
                          </td>
                          <td className="py-3 pr-4">{roas.toFixed(2)}</td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editEntry(item)}
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/[0.05]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void deleteEntry(item)}
                                className="rounded-lg border border-red-400/20 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
          <p className="font-medium">Create your first store</p>
          <p className="mt-2 text-sm text-slate-500">
            Financial KPIs stay separated by store currency, avoiding misleading
            totals across USD, EUR and GBP.
          </p>
        </div>
      )}
    </section>
  );
}
