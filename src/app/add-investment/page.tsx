"use client";

import { useState } from "react";
import { searchSymbols } from "@/server/actions/yahoo";
import { addHolding } from "@/server/actions/investments";

export default function AddInvestmentPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<any | null>(null);
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
    } catch (err: any) {
      setError(err.message || "An error occurred while searching.");
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
    } catch (err: any) {
      setError(err.message || "An error occurred while adding the holding.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Add Investment
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search for a stock or ETF and add it to your portfolio.
        </p>

        <div className="mt-8 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a symbol (e.g., AAPL)"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="mt-6">
          {results.length > 0 && !selectedSymbol && (
            <ul className="divide-y divide-gray-200">
              {results.map((result: any) => (
                <li key={result.symbol} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{result.symbol}</p>
                    <p className="text-sm text-gray-500">{result.shortname}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSymbol(result)}
                    className="rounded-md bg-green-500 px-3 py-1 text-sm font-semibold text-white hover:bg-green-600"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedSymbol && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold">
                Add {selectedSymbol.symbol} to your portfolio
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddHolding}
                    disabled={loading || !quantity || !price}
                    className="w-full rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Holding"}
                  </button>
                  <button
                    onClick={() => setSelectedSymbol(null)}
                    className="w-full rounded-md bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 text-sm text-green-600">
            {success}
          </div>
        )}
      </div>
    </main>
  );
}
