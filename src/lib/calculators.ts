export type ProfitInputs = {
  sellingPrice: number;
  productCost: number;
  shipping: number;
  adCost: number;
  fees: number;
  taxes: number;
};

export function calculateProfit(inputs: ProfitInputs) {
  const nonAdCosts =
    inputs.productCost + inputs.shipping + inputs.fees + inputs.taxes;
  const profit = inputs.sellingPrice - nonAdCosts - inputs.adCost;
  const margin =
    inputs.sellingPrice > 0 ? (profit / inputs.sellingPrice) * 100 : 0;
  const breakEvenCpa = Math.max(inputs.sellingPrice - nonAdCosts, 0);
  const breakEvenRoas =
    breakEvenCpa > 0 ? inputs.sellingPrice / breakEvenCpa : 0;
  const currentRoas =
    inputs.adCost > 0 ? inputs.sellingPrice / inputs.adCost : 0;

  return {
    nonAdCosts,
    profit,
    margin,
    breakEvenCpa,
    breakEvenRoas,
    currentRoas,
  };
}

export function scoreProduct(params: {
  margin: number;
  roasBuffer: number;
  demand: number;
  competition: number;
}) {
  const marginScore = Math.min(Math.max(params.margin, 0), 60) / 60 * 35;
  const roasScore = Math.min(Math.max(params.roasBuffer, 0), 2) / 2 * 25;
  const demandScore = Math.min(Math.max(params.demand, 1), 5) / 5 * 25;
  const competitionScore = (6 - Math.min(Math.max(params.competition, 1), 5)) / 5 * 15;

  return Math.round(marginScore + roasScore + demandScore + competitionScore);
}
