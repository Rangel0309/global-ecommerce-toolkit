import { NextRequest, NextResponse } from "next/server";
import { calculateProfit } from "@/lib/calculators";

function parseNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function calculateFromObject(input: Record<string, unknown>) {
  return calculateProfit({
    sellingPrice: parseNumber(input.sellingPrice ?? input.selling_price),
    productCost: parseNumber(input.productCost ?? input.product_cost),
    shipping: parseNumber(input.shipping),
    adCost: parseNumber(input.adCost ?? input.ad_cost),
    fees: parseNumber(input.fees),
    taxes: parseNumber(input.taxes),
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = Object.fromEntries(searchParams.entries());
  const result = calculateFromObject(input);

  return NextResponse.json({
    input: {
      sellingPrice: parseNumber(input.sellingPrice ?? input.selling_price),
      productCost: parseNumber(input.productCost ?? input.product_cost),
      shipping: parseNumber(input.shipping),
      adCost: parseNumber(input.adCost ?? input.ad_cost),
      fees: parseNumber(input.fees),
      taxes: parseNumber(input.taxes),
    },
    result,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const result = calculateFromObject(body);

  return NextResponse.json({
    input: {
      sellingPrice: parseNumber(body.sellingPrice ?? body.selling_price),
      productCost: parseNumber(body.productCost ?? body.product_cost),
      shipping: parseNumber(body.shipping),
      adCost: parseNumber(body.adCost ?? body.ad_cost),
      fees: parseNumber(body.fees),
      taxes: parseNumber(body.taxes),
    },
    result,
  });
}
