"use client";

import { calculateProfit } from "@/lib/calculators";

type Currency = "USD" | "EUR" | "GBP";

type Product = {
  id: string;
  name: string;
  market: string | null;
  selling_price: number;
  product_cost: number;
  shipping_cost: number;
  ad_cost: number;
  fees: number;
  taxes: number;
  status: string;
};

export default function ProductComparisonTable({
  products,
  currency,
}: {
  products: Product[];
  currency: Currency;
}) {
  if (products.length < 2) return null;

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
      <div className="border-b border-white/10 bg-white/[0.025] px-5 py-4">
        <p className="text-sm font-medium">Product comparison</p>
        <p className="mt-1 text-xs text-slate-500">
          Compare unit economics across saved products using the current display currency label.
        </p>
      </div>
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">CPA</th>
            <th className="px-4 py-3 font-medium">Profit / order</th>
            <th className="px-4 py-3 font-medium">Margin</th>
            <th className="px-4 py-3 font-medium">Break-even ROAS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => {
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
                <td className="px-4 py-3 text-slate-400">
                  {item.market ?? "—"}
                </td>
                <td className="px-4 py-3 capitalize">{item.status}</td>
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
