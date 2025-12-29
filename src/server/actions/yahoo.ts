"use server";

import yahooFinance from "yahoo-finance2";

export async function searchSymbols(query: string) {
  const result = await yahooFinance.search(query);
  return result.quotes;
}
