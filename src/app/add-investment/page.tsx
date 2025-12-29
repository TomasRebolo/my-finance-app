"use client";

import { useState } from "react";
import { searchSymbols } from "@/server/actions/yahoo";
import { addHolding } from "@/server/actions/investments";

type SearchResult = {
  symbol: string;
  shortname: string;
  currency: string;
};

export default function AddInvestmentPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<SearchResult | null>(
    null
  );
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) {
      return;
    }
    setLoading(true);
    setSelectedSymbol(null);
    setResults([]);
    try {
      const searchResults = await searchSymbols(query);
      setResults(searchResults);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while searching.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async () => {
    if (!selectedSymbol || !quantity || !price) {
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await addHolding({
        symbol: selectedSymbol.symbol,
        name: selectedSymbol.shortname,
        currency: selectedSymbol.currency,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
      });
      setSuccess("Holding added successfully!");
      setSelectedSymbol(null);
      setQuantity("");
      setPrice("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while adding the holding.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">
            Inspired by getquin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Add an investment without the clutter
          </h1>
          <p className="mt-2 max-w-2xl text-emerald-50/80">
            Search for a stock or ETF, pick the right one, and enter your fills—all inside a compact, friendly card.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-900/70 p-6 ring-1 ring-emerald-400/30">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a symbol (e.g., AAPL)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-emerald-500/40 transition focus:border-emerald-400"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/50 disabled:translate-y-0 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {results.length > 0 && !selectedSymbol && (
                <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/70">
                  {results.map((result) => (
                    <li key={result.symbol} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-white">{result.symbol}</p>
                        <p className="text-sm text-slate-400">{result.shortname}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSymbol(result)}
                        className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedSymbol && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-300">Selected</p>
                      <h2 className="text-lg font-semibold text-white">
                        {selectedSymbol.symbol} • {selectedSymbol.shortname}
                      </h2>
                      <p className="text-sm text-slate-400">Currency: {selectedSymbol.currency}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSymbol(null)}
                      className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-emerald-400"
                    >
                      Change
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-200">
                      Quantity
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-500/40 transition focus:border-emerald-400"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-200">
                      Purchase price
                      <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-500/40 transition focus:border-emerald-400"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleAddHolding}
                      disabled={loading || !quantity || !price}
                      className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/50 disabled:translate-y-0 disabled:opacity-50"
                    >
                      {loading ? "Adding..." : "Save holding"}
                    </button>
                    <button
                      onClick={() => setSelectedSymbol(null)}
                      className="w-full rounded-full border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-emerald-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="text-sm text-rose-300">{error}</div>}
            {success && <div className="text-sm text-emerald-200">{success}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
