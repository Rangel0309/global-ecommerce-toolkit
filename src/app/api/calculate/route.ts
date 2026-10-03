import { NextRequest, NextResponse } from "next/server";
import { calculateProfit } from "@/lib/calculators";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function normalizedInput(input: Record<string, unknown>) {
  return {
    sellingPrice: parseNumber(input.sellingPrice ?? input.selling_price),
    productCost: parseNumber(input.productCost ?? input.product_cost),
    shipping: parseNumber(input.shipping),
    adCost: parseNumber(input.adCost ?? input.ad_cost),
    fees: parseNumber(input.fees),
    taxes: parseNumber(input.taxes),
  };
}

function responseFor(input: Record<string, unknown>) {
  const normalized = normalizedInput(input);
  return NextResponse.json(
    {
      input: normalized,
      result: calculateProfit(normalized),
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const input = Object.fromEntries(request.nextUrl.searchParams.entries());
  return responseFor(input);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400, headers: corsHeaders }
    );
  }

  return responseFor(body);
}
