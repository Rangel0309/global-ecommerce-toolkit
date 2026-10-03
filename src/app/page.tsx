"use client";

import { useMemo, useState } from "react";
import { calculateProfit, scoreProduct } from "@/lib/calculators";

type Currency = "USD" | "EUR" | "GBP";

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

  const money = (value: number) =>
    `${symbols[currency]}${value.toFixed(2)}`;

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

        <label className="grid w-full gap-2 text-sm text-slate-400 md:w-40">
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
      </header>

      <section className="py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-300">Unit economics</p>
          <h2 className="mt-2 text-2xl font-semibold">Profitability calculator</h2>
          <p className="mt-2 text-sm text-slate-500">
            Estimate contribution profit, break-even CPA and break-even ROAS for one order.
          </p>
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
      </section>

      <section className="border-t border-white/10 py-10">
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

      <section className="border-t border-white/10 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-violet-300">International expansion</p>
          <h2 className="mt-2 text-2xl font-semibold">Market workspace</h2>
          <p className="mt-2 text-sm text-slate-500">
            Starting points for research. Validate tax, compliance, logistics and ad assumptions before launch.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {markets.map((market) => (
            <article key={market.code} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400">{market.code}</span>
                <span className="text-xs text-slate-500">{market.currency}</span>
              </div>
              <h3 className="mt-6 text-xl font-medium">{market.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{market.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Example AOV" value={money(sellingPrice)} />
          <Metric label="Example CPA" value={money(adCost)} />
          <Metric label="Contribution margin" value={`${result.margin.toFixed(1)}%`} />
          <Metric label="ROAS safety buffer" value={Math.max(targetRoas - result.breakEvenRoas, 0).toFixed(2)} />
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-sm text-slate-600">
        Built as an open-source project for the global ecommerce community. Calculations are estimates and do not replace accounting, legal or tax advice.
      </footer>
    </main>
  );
}
