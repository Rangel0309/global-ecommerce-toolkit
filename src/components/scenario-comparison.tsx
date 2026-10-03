"use client";

import { calculateProfit } from "@/lib/calculators";

type Currency = "USD" | "EUR" | "GBP" | "BRL";

type Scenario = {
  id: string;
  name: string;
  selling_price: number;
  product_cost: number;
  shipping_cost: number;
  ad_cost: number;
  fees: number;
  taxes: number;
};

export default function ScenarioComparison({
  scenarios,
  currency,
}: {
  scenarios: Scenario[];
  currency: Currency;
}) {
  if (scenarios.length < 2) return null;

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Scenario</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">CPA</th>
            <th className="px-4 py-3 font-medium">Profit / order</th>
            <th className="px-4 py-3 font-medium">Margin</th>
            <th className="px-4 py-3 font-medium">Break-even ROAS</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((item) => {
            const result = calculateProfit({
              sellingPrice: Number(item.selling_price),
              productCost: Number(item.product_cost),
              shipping: Number(item.shipping_cost),
              adCost: Number(item.ad_cost),
              fees: Number(item.fees),
              taxes: Number(item.taxes),
            });

            return (
              <tr key={item.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">
                  {money(Number(item.selling_price))}
                </td>
                <td className="px-4 py-3">{money(Number(item.ad_cost))}</td>
                <td className="px-4 py-3">{money(result.profit)}</td>
                <td className="px-4 py-3">{result.margin.toFixed(1)}%</td>
                <td className="px-4 py-3">{result.breakEvenRoas.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
