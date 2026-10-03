"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { calculateProfit, scoreProduct } from "@/lib/calculators";
import { supabase } from "@/lib/supabase/client";
import OperationsDashboard from "@/components/operations-dashboard";
import ScenarioComparison from "@/components/scenario-comparison";
import UtmBuilder from "@/components/utm-builder";
import AdMetricsCalculator from "@/components/ad-metrics-calculator";
import ProductComparisonTable from "@/components/product-comparison-table";
import FxConverter from "@/components/fx-converter";

type Currency = "USD" | "EUR" | "GBP";
type ProductStatus = "idea" | "testing" | "winner" | "paused" | "failed";

type Workspace = {
  id: string;
  name: string;
  base_currency: Currency;
};

type SavedProduct = {
  id: string;
  workspace_id: string | null;
  name: string;
  market: string | null;
  selling_price: number;
  product_cost: number;
  shipping_cost: number;
  ad_cost: number;
  fees: number;
  taxes: number;
  status: ProductStatus;
  created_at: string;
};

type SavedScenario = {
  id: string;
  product_id: string | null;
  name: string;
  selling_price: number;
  product_cost: number;
  shipping_cost: number;
  ad_cost: number;
  fees: number;
  taxes: number;
  created_at: string;
};

const symbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const markets = [
  {
    name: "United States",
    code: "US",
    currency: "USD",
    note: "Large addressable market, broad supplier coverage and intense ad competition.",
  },
  {
    name: "United Kingdom",
    code: "UK",
    currency: "GBP",
    note: "Compact geography, mature ecommerce adoption and strong delivery expectations.",
  },
  {
    name: "Germany",
    code: "DE",
    currency: "EUR",
    note: "Large EU market with localization, privacy and returns expectations to plan for.",
  },
];

const statusLabels: Record<ProductStatus, string> = {
  idea: "Idea",
  testing: "Testing",
  winner: "Winner",
  paused: "Paused",
  failed: "Failed",
};

function NumberInput({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-blue-400/60">
        {prefix && <span className="mr-2 text-slate-500">{prefix}</span>}
        <input
          className="w-full bg-transparent py-3 text-white outline-none"
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </label>
  );
}

function Metric({
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

export default function Home() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [sellingPrice, setSellingPrice] = useState(59.99);
  const [productCost, setProductCost] = useState(14);
  const [shipping, setShipping] = useState(5);
  const [adCost, setAdCost] = useState(18);
  const [fees, setFees] = useState(3);
  const [taxes, setTaxes] = useState(0);

  const [demand, setDemand] = useState(4);
  const [competition, setCompetition] = useState(3);
  const [targetRoas, setTargetRoas] = useState(2.5);

  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [productName, setProductName] = useState("New product");
  const [market, setMarket] = useState("United States");
  const [status, setStatus] = useState<ProductStatus>("testing");
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);

  const [scenarioName, setScenarioName] = useState("Base case");
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [scenarioMessage, setScenarioMessage] = useState("");
  const [scenarioBusy, setScenarioBusy] = useState(false);

  const result = useMemo(
    () =>
      calculateProfit({
        sellingPrice,
        productCost,
        shipping,
        adCost,
        fees,
        taxes,
      }),
    [sellingPrice, productCost, shipping, adCost, fees, taxes]
  );

  const productScore = useMemo(
    () =>
      scoreProduct({
        margin: result.margin,
        roasBuffer: Math.max(targetRoas - result.breakEvenRoas, 0),
        demand,
        competition,
      }),
    [result.margin, result.breakEvenRoas, targetRoas, demand, competition]
  );

  const portfolio = useMemo(() => {
    if (savedProducts.length === 0) {
      return {
        averageMargin: 0,
        averageBreakEvenRoas: 0,
        winners: 0,
        testing: 0,
      };
    }

    const economics = savedProducts.map((item) =>
      calculateProfit({
        sellingPrice: Number(item.selling_price),
        productCost: Number(item.product_cost),
        shipping: Number(item.shipping_cost),
        adCost: Number(item.ad_cost),
        fees: Number(item.fees),
        taxes: Number(item.taxes),
      })
    );

    return {
      averageMargin:
        economics.reduce((total, item) => total + item.margin, 0) /
        economics.length,
      averageBreakEvenRoas:
        economics.reduce((total, item) => total + item.breakEvenRoas, 0) /
        economics.length,
      winners: savedProducts.filter((item) => item.status === "winner").length,
      testing: savedProducts.filter((item) => item.status === "testing").length,
    };
  }, [savedProducts]);

  const money = (value: number) =>
    `${symbols[currency]}${Number(value).toFixed(2)}`;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) {
      setWorkspace(null);
      setSavedProducts([]);
      setScenarios([]);
      return;
    }

    void bootstrapWorkspace();
  }, [session]);

  useEffect(() => {
    if (!selectedProductId || !session || !supabase) {
      setScenarios([]);
      return;
    }

    void loadScenarios(selectedProductId);
  }, [selectedProductId, session]);

  async function bootstrapWorkspace() {
    if (!supabase || !session) return;

    let { data: existing, error } = await supabase
      .from("workspaces")
      .select("id,name,base_currency")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    if (!existing) {
      const created = await supabase
        .from("workspaces")
        .insert({
          user_id: session.user.id,
          name: "My Ecommerce Workspace",
          base_currency: currency,
        })
        .select("id,name,base_currency")
        .single();

      if (created.error) {
        setSaveMessage(created.error.message);
        return;
      }

      existing = created.data;
    }

    const nextWorkspace = existing as Workspace;
    setWorkspace(nextWorkspace);
    setCurrency(nextWorkspace.base_currency);

    await supabase
      .from("products")
      .update({ workspace_id: nextWorkspace.id })
      .eq("user_id", session.user.id)
      .is("workspace_id", null);

    await loadProducts(nextWorkspace.id);
  }

  async function loadProducts(workspaceId = workspace?.id) {
    if (!supabase || !session || !workspaceId) return;

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,workspace_id,name,market,selling_price,product_cost,shipping_cost,ad_cost,fees,taxes,status,created_at"
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    setSavedProducts((data ?? []) as SavedProduct[]);
  }

  async function loadScenarios(productId: string) {
    if (!supabase || !session) return;

    const { data, error } = await supabase
      .from("scenarios")
      .select(
        "id,product_id,name,selling_price,product_cost,shipping_cost,ad_cost,fees,taxes,created_at"
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setScenarioMessage(error.message);
      return;
    }

    setScenarios((data ?? []) as SavedScenario[]);
  }

  async function signUp() {
    if (!supabase) {
      setAuthMessage("Supabase is not configured.");
      return;
    }

    setAuthBusy(true);
    setAuthMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setAuthBusy(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage(
      data.session
        ? "Account created. You are signed in."
        : "Account created. Check your email if confirmation is required."
    );
  }

  async function signIn() {
    if (!supabase) {
      setAuthMessage("Supabase is not configured.");
      return;
    }

    setAuthBusy(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setAuthBusy(false);
    setAuthMessage(error ? error.message : "Signed in successfully.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthMessage("Signed out.");
  }

  function resetProductForm() {
    setSelectedProductId(null);
    setProductName("New product");
    setMarket("United States");
    setStatus("testing");
    setSellingPrice(59.99);
    setProductCost(14);
    setShipping(5);
    setAdCost(18);
    setFees(3);
    setTaxes(0);
    setScenarios([]);
    setSaveMessage("");
    setScenarioMessage("");
  }

  function loadProductIntoForm(item: SavedProduct) {
    setSelectedProductId(item.id);
    setProductName(item.name);
    setMarket(item.market ?? "United States");
    setStatus(item.status);
    setSellingPrice(Number(item.selling_price));
    setProductCost(Number(item.product_cost));
    setShipping(Number(item.shipping_cost));
    setAdCost(Number(item.ad_cost));
    setFees(Number(item.fees));
    setTaxes(Number(item.taxes));
    setSaveMessage("Product loaded for editing.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct() {
    if (!supabase || !session || !workspace) {
      setSaveMessage("Sign in to save this product.");
      return;
    }

    setSaveBusy(true);
    setSaveMessage("");

    const payload = {
      user_id: session.user.id,
      workspace_id: workspace.id,
      name: productName.trim() || "Untitled product",
      market,
      selling_price: sellingPrice,
      product_cost: productCost,
      shipping_cost: shipping,
      ad_cost: adCost,
      fees,
      taxes,
      status,
    };

    const query = selectedProductId
      ? supabase.from("products").update(payload).eq("id", selectedProductId)
      : supabase.from("products").insert(payload).select("id").single();

    const { data, error } = await query;
    setSaveBusy(false);

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    if (!selectedProductId && data && "id" in data) {
      setSelectedProductId(String(data.id));
    }

    setSaveMessage(selectedProductId ? "Product updated." : "Product saved.");
    await loadProducts(workspace.id);
  }

  async function updateStatus(item: SavedProduct, nextStatus: ProductStatus) {
    if (!supabase || !workspace) return;

    const { error } = await supabase
      .from("products")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    await loadProducts(workspace.id);

    if (selectedProductId === item.id) {
      setStatus(nextStatus);
    }
  }

  async function deleteProduct(item: SavedProduct) {
    if (!supabase || !workspace) return;

    const confirmed = window.confirm(
      `Delete "${item.name}" and its saved scenarios?`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", item.id);

    if (error) {
      setSaveMessage(error.message);
      return;
    }

    if (selectedProductId === item.id) {
      resetProductForm();
    }

    await loadProducts(workspace.id);
  }

  async function saveScenario() {
    if (!supabase || !session) {
      setScenarioMessage("Sign in first.");
      return;
    }

    if (!selectedProductId) {
      setScenarioMessage("Save or load a product before saving a scenario.");
      return;
    }

    setScenarioBusy(true);
    setScenarioMessage("");

    const { error } = await supabase.from("scenarios").insert({
      user_id: session.user.id,
      product_id: selectedProductId,
      name: scenarioName.trim() || "Scenario",
      selling_price: sellingPrice,
      product_cost: productCost,
      shipping_cost: shipping,
      ad_cost: adCost,
      fees,
      taxes,
    });

    setScenarioBusy(false);

    if (error) {
      setScenarioMessage(error.message);
      return;
    }

    setScenarioMessage("Scenario saved.");
    await loadScenarios(selectedProductId);
  }

  function applyScenario(item: SavedScenario) {
    setSellingPrice(Number(item.selling_price));
    setProductCost(Number(item.product_cost));
    setShipping(Number(item.shipping_cost));
    setAdCost(Number(item.ad_cost));
    setFees(Number(item.fees));
    setTaxes(Number(item.taxes));
    setScenarioMessage(`Scenario "${item.name}" loaded.`);
  }

  function exportCalculatorCsv() {
    const rows = [
      ["field", "value"],
      ["product_name", productName],
      ["market", market],
      ["currency", currency],
      ["selling_price", sellingPrice],
      ["product_cost", productCost],
      ["shipping", shipping],
      ["ad_cost_cpa", adCost],
      ["fees", fees],
      ["taxes", taxes],
      ["profit_per_order", result.profit],
      ["net_margin_percent", result.margin],
      ["break_even_cpa", result.breakEvenCpa],
      ["break_even_roas", result.breakEvenRoas],
      ["current_roas", result.currentRoas],
      ["product_signal_score", productScore],
    ];

    const escapeCell = (value: string | number) => {
      const text = String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const csv = rows
      .map((row) => row.map((value) => escapeCell(value)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName =
      productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
      "product";
    link.href = url;
    link.download = `${safeName}-economics.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <header className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-300">
            Free & open source
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Global Ecommerce Toolkit
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
            Practical calculators and decision tools for operators selling across
            international markets.
          </p>
        </div>

        <div className="grid w-full gap-3 md:w-auto md:min-w-64">
          <label className="grid gap-2 text-sm text-slate-400">
            Display currency
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </label>

          {session && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400">
              <span className="max-w-40 truncate">{session.user.email}</span>
              <button
                onClick={signOut}
                className="rounded-lg border border-white/10 px-2 py-1 text-white hover:bg-white/[0.06]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="sticky top-0 z-20 -mx-5 overflow-x-auto border-b border-white/10 bg-[#070b12]/95 px-5 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="mx-auto flex min-w-max gap-2 text-xs text-slate-400">
          {[
            ["#operations", "Operations"],
            ["#products", "Products"],
            ["#validation", "Validation"],
            ["#ads", "Ads"],
            ["#utm", "UTM"],
            ["#fx", "FX"],
            ["#markets", "Markets"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/[0.05] hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section className="grid gap-6 border-b border-white/10 py-10 lg:grid-cols-[1fr_.9fr]">
        <div>
          <p className="text-sm font-medium text-cyan-300">Operator account</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {session ? "Your workspace is connected" : "Sign in to save your work"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Calculators work without an account. Sign in only when you want to persist products and scenarios.
          </p>
        </div>

        {!session ? (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-5">
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={authBusy}
                onClick={signIn}
                className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
              >
                Sign in
              </button>
              <button
                disabled={authBusy}
                onClick={signUp}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                Create account
              </button>
            </div>
            {authMessage && <p className="text-xs text-slate-400">{authMessage}</p>}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
            <p className="text-sm font-medium text-emerald-300">Connected to Supabase</p>
            <p className="mt-2 text-sm text-slate-400">
              {workspace
                ? `${workspace.name} is ready. Saved products are private to your account.`
                : "Preparing your workspace..."}
            </p>
          </div>
        )}
      </section>

      {session && (
        <section className="border-b border-white/10 py-10">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">Portfolio dashboard</p>
              <h2 className="mt-2 text-2xl font-semibold">Your ecommerce workspace</h2>
              <p className="mt-2 text-sm text-slate-500">
                A quick view of the products currently stored in your workspace.
              </p>
            </div>
            <button
              onClick={resetProductForm}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/[0.05]"
            >
              + New product
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Products" value={String(savedProducts.length)} />
            <Metric label="Testing" value={String(portfolio.testing)} />
            <Metric label="Winners" value={String(portfolio.winners)} />
            <Metric
              label="Avg. margin"
              value={`${portfolio.averageMargin.toFixed(1)}%`}
              helper={
                savedProducts.length
                  ? `Avg. break-even ROAS: ${portfolio.averageBreakEvenRoas.toFixed(2)}`
                  : "Save products to populate the dashboard."
              }
            />
          </div>
        </section>
      )}

      {session && workspace && (
        <OperationsDashboard
          userId={session.user.id}
          workspaceId={workspace.id}
        />
      )}

      <section id="products" className="scroll-mt-20 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-300">Unit economics</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {selectedProductId ? "Edit product economics" : "Profitability calculator"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Estimate contribution profit, break-even CPA and break-even ROAS for one order.
          </p>
        </div>

        <div className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-slate-300">
            Product name
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Market
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 outline-none"
              value={market}
              onChange={(event) => setMarket(event.target.value)}
            >
              {markets.map((item) => (
                <option key={item.code}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Status
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 outline-none"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProductStatus)}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-5 md:grid-cols-2 md:p-7">
            <NumberInput label="Selling price" value={sellingPrice} onChange={setSellingPrice} prefix={symbols[currency]} />
            <NumberInput label="Product cost" value={productCost} onChange={setProductCost} prefix={symbols[currency]} />
            <NumberInput label="Shipping" value={shipping} onChange={setShipping} prefix={symbols[currency]} />
            <NumberInput label="Ad cost / CPA" value={adCost} onChange={setAdCost} prefix={symbols[currency]} />
            <NumberInput label="Payment & platform fees" value={fees} onChange={setFees} prefix={symbols[currency]} />
            <NumberInput label="Taxes / duties" value={taxes} onChange={setTaxes} prefix={symbols[currency]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric label="Profit / order" value={money(result.profit)} />
            <Metric label="Net margin" value={`${result.margin.toFixed(1)}%`} />
            <Metric label="Break-even CPA" value={money(result.breakEvenCpa)} helper="Maximum acquisition cost before contribution profit reaches zero." />
            <Metric label="Break-even ROAS" value={result.breakEvenRoas.toFixed(2)} helper="Revenue ÷ maximum break-even ad spend." />
            <Metric label="Current ROAS" value={result.currentRoas.toFixed(2)} />
            <Metric label="Non-ad costs" value={money(result.nonAdCosts)} />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={saveProduct}
            disabled={saveBusy}
            className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {saveBusy
              ? "Saving..."
              : selectedProductId
              ? "Update product"
              : "Save product"}
          </button>
          {selectedProductId && (
            <button
              onClick={resetProductForm}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/[0.05]"
            >
              Cancel edit
            </button>
          )}
          <button
            onClick={exportCalculatorCsv}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm hover:bg-white/[0.05]"
          >
            Export CSV
          </button>
          {saveMessage && <p className="text-sm text-slate-400">{saveMessage}</p>}
        </div>

        {session && selectedProductId && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-fuchsia-300">Scenario lab</p>
                <h3 className="mt-1 text-lg font-semibold">Save pricing and CPA scenarios</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Test alternative prices, costs or acquisition targets without losing the product baseline.
                </p>
              </div>
              <div className="flex w-full gap-3 lg:w-auto">
                <input
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm outline-none lg:w-52"
                  value={scenarioName}
                  onChange={(event) => setScenarioName(event.target.value)}
                  placeholder="Scenario name"
                />
                <button
                  onClick={saveScenario}
                  disabled={scenarioBusy}
                  className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-3 text-sm text-fuchsia-200 disabled:opacity-50"
                >
                  {scenarioBusy ? "Saving..." : "Save scenario"}
                </button>
              </div>
            </div>

            {scenarioMessage && (
              <p className="mt-3 text-sm text-slate-400">{scenarioMessage}</p>
            )}

            {scenarios.length > 0 && (
              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {scenarios.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => applyScenario(item)}
                    className="rounded-xl border border-white/10 p-4 text-left hover:bg-white/[0.04]"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Price {money(Number(item.selling_price))} · CPA {money(Number(item.ad_cost))}
                    </p>
                    <p className="mt-2 text-xs text-blue-300">Load scenario</p>
                  </button>
                ))}
              </div>
            )}

            <ScenarioComparison scenarios={scenarios} currency={currency} />
          </div>
        )}
      </section>

      {session && (
        <section className="border-t border-white/10 py-10">
          <div className="mb-6">
            <p className="text-sm font-medium text-amber-300">Saved workspace</p>
            <h2 className="mt-2 text-2xl font-semibold">Products</h2>
            <p className="mt-2 text-sm text-slate-500">
              Load a product to edit its economics or change its operating status directly here.
            </p>
          </div>

          {savedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
              No products saved yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedProducts.map((item) => {
                const economics = calculateProfit({
                  sellingPrice: Number(item.selling_price),
                  productCost: Number(item.product_cost),
                  shipping: Number(item.shipping_cost),
                  adCost: Number(item.ad_cost),
                  fees: Number(item.fees),
                  taxes: Number(item.taxes),
                });

                return (
                  <article
                    key={item.id}
                    className={
                      "rounded-2xl border p-5 " +
                      (selectedProductId === item.id
                        ? "border-blue-400/40 bg-blue-400/[0.06]"
                        : "border-white/10 bg-white/[0.035]")
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.market ?? "No market"}
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs outline-none"
                        value={item.status}
                        onChange={(event) =>
                          void updateStatus(
                            item,
                            event.target.value as ProductStatus
                          )
                        }
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Selling price</p>
                        <p className="mt-1">{money(Number(item.selling_price))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">CPA</p>
                        <p className="mt-1">{money(Number(item.ad_cost))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Margin</p>
                        <p className="mt-1">{economics.margin.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Break-even ROAS</p>
                        <p className="mt-1">{economics.breakEvenRoas.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => loadProductIntoForm(item)}
                        className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/[0.05]"
                      >
                        Load / edit
                      </button>
                      <button
                        onClick={() => void deleteProduct(item)}
                        className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <ProductComparisonTable products={savedProducts} currency={currency} />
        </section>
      )}

      <section id="validation" className="scroll-mt-20 border-t border-white/10 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-emerald-300">Validation</p>
          <h2 className="mt-2 text-2xl font-semibold">Product signal score</h2>
          <p className="mt-2 text-sm text-slate-500">
            A lightweight directional score. It is not a prediction of product success.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl border border-white/10 bg-slate-950/50 p-5 lg:grid-cols-[1fr_280px] md:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-slate-300">
              Demand signal (1–5)
              <input type="range" min="1" max="5" value={demand} onChange={(e) => setDemand(Number(e.target.value))} />
              <span className="text-slate-500">{demand}/5</span>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Competition (1–5)
              <input type="range" min="1" max="5" value={competition} onChange={(e) => setCompetition(Number(e.target.value))} />
              <span className="text-slate-500">{competition}/5</span>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Target ROAS
              <input
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
                type="number"
                min="0"
                step="0.1"
                value={targetRoas}
                onChange={(e) => setTargetRoas(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signal score</p>
              <p className="mt-2 text-5xl font-semibold">{productScore}</p>
              <p className="mt-2 text-xs text-slate-500">out of 100</p>
            </div>
          </div>
        </div>
      </section>

      <AdMetricsCalculator />

      <UtmBuilder />

      <FxConverter />

      <section id="markets" className="scroll-mt-20 border-t border-white/10 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-violet-300">International expansion</p>
          <h2 className="mt-2 text-2xl font-semibold">Market workspace</h2>
          <p className="mt-2 text-sm text-slate-500">
            Starting points for research. Validate tax, compliance, logistics and ad assumptions before launch.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {markets.map((item) => (
            <article key={item.code} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">{item.code}</span>
                <span className="text-xs text-slate-500">{item.currency}</span>
              </div>
              <h3 className="mt-6 text-xl font-medium">{item.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-sm text-slate-600">
        Built as an open-source project for the global ecommerce community. Calculations are estimates and do not replace accounting, legal or tax advice.
      </footer>
    </main>
  );
}
