"use client";

import { useEffect, useMemo, useState } from "react";

type Currency = "USD" | "EUR" | "GBP";

type FxResponse = {
  base: Currency;
  quote: Currency;
  rate: number;
  date: string;
  source: string;
  sourceUrl?: string;
  error?: string;
};

const currencies: Currency[] = ["USD", "EUR", "GBP"];

export default function FxConverter() {
  const [amount, setAmount] = useState(100);
  const [base, setBase] = useState<Currency>("USD");
  const [quote, setQuote] = useState<Currency>("EUR");
  const [liveRate, setLiveRate] = useState(0);
  const [rateDate, setRateDate] = useState("");
  const [manualRate, setManualRate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRate() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/fx?base=${base}&quote=${quote}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as FxResponse;

      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to load exchange rate.");
      }

      setLiveRate(Number(data.rate));
      setRateDate(data.date);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load exchange rate."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setManualRate("");
    void loadRate();
  }, [base, quote]);

  const effectiveRate = useMemo(() => {
    const override = Number(manualRate);
    return override > 0 ? override : liveRate;
  }, [manualRate, liveRate]);

  const converted = amount * effectiveRate;

  function swapCurrencies() {
    setBase(quote);
    setQuote(base);
  }

  return (
    <section id="fx" className="scroll-mt-20 border-t border-white/10 py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-teal-300">Currency utility</p>
        <h2 className="mt-2 text-2xl font-semibold">FX reference converter</h2>
        <p className="mt-2 text-sm text-slate-500">
          Convert USD, EUR and GBP using a daily reference rate, with an optional
          manual override for reconciliation.
        </p>
      </div>

      <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:grid-cols-[1fr_.8fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Amount
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Manual rate override
            <input
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none"
              type="number"
              min="0"
              step="0.000001"
              value={manualRate}
              onChange={(event) => setManualRate(event.target.value)}
              placeholder={liveRate ? liveRate.toFixed(6) : "Optional"}
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            From
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 outline-none"
              value={base}
              onChange={(event) => setBase(event.target.value as Currency)}
            >
              {currencies.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            To
            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 outline-none"
              value={quote}
              onChange={(event) => setQuote(event.target.value as Currency)}
            >
              {currencies.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              onClick={swapCurrencies}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/[0.05]"
            >
              Swap
            </button>
            <button
              onClick={() => void loadRate()}
              disabled={loading}
              className="rounded-xl border border-teal-400/30 bg-teal-400/10 px-4 py-2.5 text-sm text-teal-200 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh rate"}
            </button>
            {manualRate && (
              <button
                onClick={() => setManualRate("")}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm hover:bg-white/[0.05]"
              >
                Use live rate
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-48 items-center rounded-2xl border border-white/10 bg-slate-950/60 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Converted amount
            </p>
            <p className="mt-3 text-4xl font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: quote,
              }).format(converted || 0)}
            </p>
            <p className="mt-4 text-sm text-slate-400">
              1 {base} = {effectiveRate ? effectiveRate.toFixed(6) : "—"} {quote}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {manualRate
                ? "Manual override in use."
                : rateDate
                ? `Reference date: ${rateDate} · Source: Frankfurter`
                : "Loading reference rate..."}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Reference rates are for planning and reconciliation, not intraday
              trading quotes.
            </p>
            {message && <p className="mt-3 text-xs text-red-300">{message}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
