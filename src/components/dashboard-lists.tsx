"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import useSWR from "swr";

type Holding = {
  id: string;
  currentPrice: number;
  change: number;
  percentageChange: number;
  currency: string;
  quantity: string;
  investment: {
    symbol: string;
    name: string;
    currency: string;
    logoUrl?: string | null;
  };
};

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  availableBalance: string | null;
};

type Quote = {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
};

type SortField = "name" | "value";
type SortDirection = "asc" | "desc";

function formatMoney(value: string | number, currency: string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(n);
}

const fetcher = (url: string, symbols: string[]) =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symbols }),
  }).then((res) => res.json());

export function InvestmentsList({ holdings: initialHoldings }: { holdings: Holding[] }) {
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAll, setShowAll] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Removed SWR polling to avoid rate limits and currency mismatch issues.
  // The server (page.tsx) handles rate fetching and currency conversion correctly.

  const holdings = useMemo(() => {
    return initialHoldings; // Use server-provided converted data directly
  }, [initialHoldings]);

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      if (sortField === "name") {
        const comparison = a.investment.name.localeCompare(b.investment.name);
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        const aValue = a.currentPrice * Number(a.quantity);
        const bValue = b.currentPrice * Number(b.quantity);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  }, [holdings, sortField, sortDirection]);

  const displayedHoldings = showAll
    ? sortedHoldings
    : sortedHoldings.slice(0, ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/50">
          <ChartIcon className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-400">No investments yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Import a CSV/XLSX or add one manually to see your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Sort by:</span>
        <button
          onClick={() => toggleSort("name")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${sortField === "name"
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Name
          {sortField === "name" && (
            <SortIcon className={`h-3.5 w-3.5 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
          )}
        </button>
        <button
          onClick={() => toggleSort("value")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${sortField === "value"
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Value
          {sortField === "value" && (
            <SortIcon className={`h-3.5 w-3.5 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
          )}
        </button>
      </div>

      {/* Holdings grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {displayedHoldings.map((h) => {
          const positionValue = h.currentPrice * Number(h.quantity);
          return (
            <div
              key={h.id}
              className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition hover:border-emerald-500/30 hover:bg-slate-800/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xs font-bold text-white overflow-hidden">
                    {h.investment.logoUrl ? (
                      <img src={h.investment.logoUrl} alt={h.investment.symbol} className="h-full w-full object-contain p-1" />
                    ) : (
                      h.investment.symbol.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs font-semibold text-slate-200">
                        {h.investment.symbol}
                      </span>
                      <span className="text-xs text-slate-500">{h.investment.currency}</span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-medium text-white">
                      {h.investment.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {Number(h.quantity).toLocaleString()} units @ {formatMoney(h.currentPrice, h.currency)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold text-white">
                    {formatMoney(positionValue, h.currency)}
                  </p>
                  <p
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${h.change >= 0
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                      }`}
                  >
                    <ArrowTrendIcon
                      className={`h-3 w-3 ${h.change >= 0 ? "" : "rotate-180"}`}
                    />
                    {h.change >= 0 ? "+" : ""}{h.percentageChange.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View more button */}
      {holdings.length > ITEMS_PER_PAGE && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
          >
            {showAll ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                View all {holdings.length} investments
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function AccountsList({ accounts }: { accounts: Account[] }) {
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAll, setShowAll] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (sortField === "name") {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? comparison : -comparison;
      } else {
        const aValue = Number(a.balance);
        const bValue = Number(b.balance);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  }, [accounts, sortField, sortDirection]);

  const displayedAccounts = showAll
    ? sortedAccounts
    : sortedAccounts.slice(0, ITEMS_PER_PAGE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-700/50">
          <BankIcon className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-slate-400">No accounts connected yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Connect a bank to see your balances here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">Sort by:</span>
        <button
          onClick={() => toggleSort("name")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${sortField === "name"
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Name
          {sortField === "name" && (
            <SortIcon className={`h-3.5 w-3.5 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
          )}
        </button>
        <button
          onClick={() => toggleSort("value")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${sortField === "value"
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
        >
          Balance
          {sortField === "value" && (
            <SortIcon className={`h-3.5 w-3.5 ${sortDirection === "asc" ? "" : "rotate-180"}`} />
          )}
        </button>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayedAccounts.map((a) => (
          <Link
            key={a.id}
            href={`/accounts/${a.id}`}
            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 transition hover:border-blue-500/30 hover:bg-slate-800/70"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <BankIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-xs font-medium text-slate-300">
                    {a.type}
                  </span>
                  <span className="text-xs text-slate-500">{a.currency}</span>
                </div>
                <h3 className="mt-1 truncate text-sm font-medium text-white group-hover:text-blue-200">
                  {a.name}
                </h3>
                <p className="mt-2 text-lg font-semibold text-white">
                  {formatMoney(a.balance, a.currency)}
                </p>
                {a.availableBalance !== null && (
                  <p className="text-xs text-slate-400">
                    Available:{" "}
                    <span className="text-emerald-300">
                      {formatMoney(a.availableBalance, a.currency)}
                    </span>
                  </p>
                )}
              </div>
              <ChevronRightIcon className="h-5 w-5 text-slate-600 transition group-hover:text-slate-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* View more button */}
      {accounts.length > ITEMS_PER_PAGE && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:text-white"
          >
            {showAll ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                View all {accounts.length} accounts
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Icons
function ChartIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function BankIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V3" />
      <path d="M5 21V12" />
      <path d="M19 21V12" />
      <path d="M5 12H19" />
      <path d="M5 7l7-4 7 4" />
    </svg>
  );
}

function ArrowTrendIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 9 11 13 15 21 7" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function SortIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

function ChevronRightIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}