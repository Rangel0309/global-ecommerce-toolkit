import { NextRequest, NextResponse } from "next/server";

const supported = new Set(["USD", "EUR", "GBP", "BRL"]);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const base = (request.nextUrl.searchParams.get("base") ?? "USD").toUpperCase();
  const quote = (request.nextUrl.searchParams.get("quote") ?? "EUR").toUpperCase();

  if (!supported.has(base) || !supported.has(quote)) {
    return NextResponse.json(
      { error: "Supported currencies are USD, EUR, GBP and BRL." },
      { status: 400, headers: corsHeaders }
    );
  }

  if (base === quote) {
    return NextResponse.json(
      {
        base,
        quote,
        rate: 1,
        date: new Date().toISOString().slice(0, 10),
        source: "identity",
      },
      { headers: corsHeaders }
    );
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quote}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`FX provider returned ${response.status}`);
    }

    const data = (await response.json()) as Array<{
      date: string;
      base: string;
      quote: string;
      rate: number;
    }>;

    const item = data.find(
      (rate) =>
        rate.base.toUpperCase() === base && rate.quote.toUpperCase() === quote
    );

    if (!item) {
      throw new Error("Requested rate was not returned.");
    }

    return NextResponse.json(
      {
        base,
        quote,
        rate: Number(item.rate),
        date: item.date,
        source: "Frankfurter",
        sourceUrl: "https://frankfurter.dev/",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the exchange rate.",
      },
      { status: 502, headers: corsHeaders }
    );
  }
}
