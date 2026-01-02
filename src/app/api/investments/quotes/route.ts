import { NextResponse } from "next/server";
import { ensureUser } from "@/server/auth/ensureUser";
import yahooFinance from "yahoo-finance2";

async function fetchQuotesSafely(symbols: string[]) {
  if (symbols.length === 0) {
    return [];
  }

  try {
    const result = await yahooFinance.quote(symbols);
    const quotes = Array.isArray(result) ? result : [result];
    return quotes.filter(
      (quote): quote is NonNullable<typeof quotes[number]> =>
        Boolean(quote && "symbol" in quote)
    );
  } catch (error) {
    console.error("Failed to fetch quotes from Yahoo Finance", error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    await ensureUser();
    const { symbols } = await request.json();

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "Symbols must be an array of strings." },
        { status: 400 }
      );
    }

    const quotes = await fetchQuotesSafely(symbols);

    return NextResponse.json(quotes);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in quotes API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
