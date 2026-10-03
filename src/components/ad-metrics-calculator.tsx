"use client";

import { useMemo, useState } from "react";

function Stat({
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
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

export default function AdMetricsCalculator() {
  const [spend, setSpend] = useState(500);
  const [impressions, setImpressions] = useState(50000);
  const [clicks, setClicks] = useState(1250);
  const [conversions, setConversions] = useState(35);
  const [revenue, setRevenue] = useState(1750);

  const metrics = useMemo(() => {
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    return { ctr, cpc, cpm, cvr, cpa, roas };
  }, [spend, impressions, clicks, conversions, revenue]);

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 outline-none";

  return (
    <section id="ads" className="scroll-mt-20 border-t border-white/10 py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-orange-300">Paid traffic</p>
        <h2 className="mt-2 text-2xl font-semibold">Ad metrics calculator</h2>
        <p className="mt-2 text-sm text-slate-500">
          Turn raw campaign numbers into the operating metrics used to judge paid traffic.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/50 p-5 sm:grid-cols-2">
          {[
            ["Ad spend", spend, setSpend],
            ["Impressions", impressions, setImpressions],
            ["Clicks", clicks, setClicks],
            ["Conversions", conversions, setConversions],
            ["Revenue", revenue, setRevenue],
          ].map(([label, value, setter]) => (
            <label key={String(label)} className="grid gap-2 text-sm text-slate-300">
              {String(label)}
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={Number(value)}
                onChange={(event) =>
                  (setter as (value: number) => void)(Number(event.target.value))
                }
              />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Stat label="CTR" value={`${metrics.ctr.toFixed(2)}%`} helper="Clicks ÷ impressions" />
          <Stat label="CPC" value={`$${metrics.cpc.toFixed(2)}`} helper="Spend ÷ clicks" />
          <Stat label="CPM" value={`$${metrics.cpm.toFixed(2)}`} helper="Cost per 1,000 impressions" />
          <Stat label="CVR" value={`${metrics.cvr.toFixed(2)}%`} helper="Conversions ÷ clicks" />
          <Stat label="CPA" value={`$${metrics.cpa.toFixed(2)}`} helper="Spend ÷ conversions" />
          <Stat label="ROAS" value={metrics.roas.toFixed(2)} helper="Revenue ÷ spend" />
        </div>
      </div>
    </section>
  );
}
