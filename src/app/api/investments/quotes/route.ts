import { NextResponse } from "next/server";
import { ensureUser } from "@/server/auth/ensureUser";
import yahooFinance from "yahoo-finance2";

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

async function fetchQuotesSafely(symbols: string[]) {
  if (symbols.length === 0) {
    return [];
  }

  // Check cache (key is sorted symbols joined)
  const cacheKey = [...symbols].sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const result = await yahooFinance.quote(symbols);
    const quotes = Array.isArray(result) ? result : [result];
    const validQuotes = quotes.filter(
      (quote): quote is NonNullable<typeof quotes[number]> =>
        Boolean(quote && "symbol" in quote)
    );

    // Update cache
    cache.set(cacheKey, { data: validQuotes, timestamp: Date.now() });

    return validQuotes;
  } catch (error) {
    console.error("Failed to fetch quotes from Yahoo Finance", error);
    // Return cached stale data if available, otherwise empty
    if (cached) return cached.data;
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
