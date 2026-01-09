import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db/prisma";
import yahooFinance from "yahoo-finance2";
import { ImportPortfolioButton } from "@/components/import-portfolio-button";
import { ConnectBrokerageButton } from "@/components/connect-brokerage-button";
import { SyncPortfolioButton } from "@/components/sync-portfolio-button";
import { ResetDataButton } from "@/components/reset-data-button";
import { CurrencyToggle } from "@/components/currency-toggle";
import { InvestmentsList, AccountsList } from "@/components/dashboard-lists";
import { ensureUser } from "@/server/auth/ensureUser";
import { UserButton } from "@clerk/nextjs";

const QUOTE_REVALIDATE_SECONDS = 60;
const RETRY_DELAY_MS = 500;
const RETRY_ATTEMPTS = 2;

function formatMoney(value: string | number, currency: string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(n);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function quoteWithRetry(symbols: string[]) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await yahooFinance.quote(symbols);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("Too Many Requests") || attempt === RETRY_ATTEMPTS) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError ?? new Error("Failed to fetch quotes");
}

const fetchQuotesCached = unstable_cache(
  async (symbols: string[]) => quoteWithRetry(symbols),
  ["yahoo-finance-quotes"],
  { revalidate: QUOTE_REVALIDATE_SECONDS }
);

// Helper to fetch exchange rates
async function getExchangeRates(base: "EUR" | "USD") {
  const target = base;
  const symbolsToFetch = [];

  if (target === "EUR") {
    symbolsToFetch.push("USDEUR=X"); // USD to EUR
    symbolsToFetch.push("GBPEUR=X"); // GBP to EUR
  } else {
    symbolsToFetch.push("EURUSD=X"); // EUR to USD
    symbolsToFetch.push("GBPUSD=X"); // GBP to USD
  }

  // Hardcoded fallbacks
  const fallbacks: Record<string, number> = {
    "USDEUR=X": 0.95,
    "GBPEUR=X": 1.18,
    "EURUSD=X": 1.05,
    "GBPUSD=X": 1.22,
  };

  try {
    const results = await fetchQuotesCached(symbolsToFetch);
    const rates: Record<string, number> = {};
    const quotes = Array.isArray(results) ? results : [results];

    quotes.forEach(q => {
      if (q.symbol === "USDEUR=X") rates["USD"] = q.regularMarketPrice || fallbacks["USDEUR=X"];
      if (q.symbol === "GBPEUR=X") rates["GBP"] = q.regularMarketPrice || fallbacks["GBPEUR=X"];
      if (q.symbol === "EURUSD=X") rates["EUR"] = q.regularMarketPrice || fallbacks["EURUSD=X"];
      if (q.symbol === "GBPUSD=X") rates["GBP"] = q.regularMarketPrice || fallbacks["GBPUSD=X"];
    });

    // Ensure all requested rates exist
    if (target === "EUR") {
      if (!rates["USD"]) rates["USD"] = fallbacks["USDEUR=X"];
      if (!rates["GBP"]) rates["GBP"] = fallbacks["GBPEUR=X"];
    } else {
      if (!rates["EUR"]) rates["EUR"] = fallbacks["EURUSD=X"];
      if (!rates["GBP"]) rates["GBP"] = fallbacks["GBPUSD=X"];
    }

    // Base to Base is always 1
    rates[base] = 1;

    return rates;
  } catch (e) {
    console.error("Failed to fetch rates, using fallbacks");
    const rates: Record<string, number> = {};
    if (target === "EUR") {
      rates["USD"] = fallbacks["USDEUR=X"];
      rates["GBP"] = fallbacks["GBPEUR=X"];
    } else {
      rates["EUR"] = fallbacks["EURUSD=X"];
      rates["GBP"] = fallbacks["GBPUSD=X"];
    }
    rates[base] = 1;
    return rates;
  }
}

export default async function DashboardPage({
  searchParams: { currency: currencyParam },
}: {
  searchParams: { currency?: string };
}) {
  const user = await ensureUser();
  const preferredCurrency = (currencyParam === "USD" ? "USD" : "EUR") as "EUR" | "USD";

  const userWithHoldings = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      holdings: {
        include: {
          investment: true,
        },
      },
    },
  });
  if (!userWithHoldings) redirect("/");

  const rates = await getExchangeRates(preferredCurrency);

  // Helper to convert any amount to preferred currency
  const convert = (amount: number, fromCurrency: string) => {
    if (fromCurrency === preferredCurrency) return amount;
    const from = fromCurrency.toUpperCase();
    if (rates[from]) {
      return amount * rates[from];
    }
    return amount;
  };

  const accounts = await prisma.account.findMany({
    where: { bankConnection: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  const totalCash = accounts.reduce((sum, a) => {
    const val = Number(a.balance);
    const converted = convert(val, a.currency);
    return sum + converted;
  }, 0);

  const symbols = userWithHoldings.holdings.map((h) => h.investment.symbol);
  const quotes = await fetchQuotesSafely(symbols);

  const holdingsWithCurrentPrice = userWithHoldings.holdings.map((holding) => {
    const quote = quotes.find((q) => q.symbol === holding.investment.symbol);
    const fallbackPrice = Number(holding.price) || 0;
    let currency = quote?.currency || holding.investment.currency;
    let currentPrice = quote?.regularMarketPrice ?? fallbackPrice;

    // Fix for LSE stocks quoted in pence (GBp)
    if (currency === "GBp") {
      currentPrice = currentPrice / 100;
      currency = "GBP";
    } else if (holding.investment.symbol.endsWith(".L") && currentPrice > 500) {
      // Heuristic: If it's a London stock and price is > 500, it's likely in pence
      // regardless of what the currency says (e.g. if it incorrectly says USD or GBP)
      currentPrice = currentPrice / 100;
      currency = "GBP";
    }

    const change = quote?.regularMarketChange ?? 0;
    // Adjust change value as well if in pence
    const adjustedChange = quote?.currency === "GBp" ? change / 100 : change;

    const previousPrice = currentPrice - adjustedChange;
    const percentageChange = previousPrice !== 0 ? (adjustedChange / previousPrice) * 100 : 0;

    // Convert values to preferred currency for display
    const convertedPrice = convert(currentPrice, currency);
    const convertedChange = convert(adjustedChange, currency);

    return {
      id: holding.id,
      currentPrice: convertedPrice,
      change: convertedChange,
      percentageChange,
      currency: preferredCurrency, // Display in preferred currency
      quantity: holding.quantity.toString(),
      investment: {
        symbol: holding.investment.symbol,
        name: holding.investment.name,
        currency: preferredCurrency, // Override here too for consistency if needed, or keep original? 

        logoUrl: holding.investment.logoUrl,
      },
    };
  });

  const totalInvestments = holdingsWithCurrentPrice.reduce(
    (sum, h) => {
      const val = h.currentPrice * Number(h.quantity);
      return sum + convert(val, h.currency);
    },
    0
  );
  const dailyChange = holdingsWithCurrentPrice.reduce(
    (sum, h) => {
      const val = h.change * Number(h.quantity);
      return sum + convert(val, h.currency);
    },
    0
  );
  const netWorth = totalCash + totalInvestments;
  const dailyChangePercent = totalInvestments > 0 ? (dailyChange / (totalInvestments - dailyChange)) * 100 : 0;
  const positiveHoldings = holdingsWithCurrentPrice.filter((h) => h.change >= 0).length;
  const negativeHoldings = holdingsWithCurrentPrice.length - positiveHoldings;

  // Transform accounts for the client component
  const accountsForClient = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance.toString(),
    availableBalance: a.availableBalance?.toString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
                  <WalletIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">WealthView</span>
              </div>
              <div className="flex items-center gap-4">
                <CurrencyToggle />
                <ImportPortfolioButton
                  label="Import CSV"
                  className="hidden sm:inline-flex bg-slate-700/50 hover:bg-slate-700 text-white"
                />
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Portfolio Summary Hero */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_100%_50%,rgba(255,255,255,0.1),transparent_60%)]" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <p className="text-emerald-100/80 text-sm font-medium uppercase tracking-wider mb-2">
                    Total Portfolio Value
                  </p>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                    {formatMoney(netWorth, preferredCurrency)}
                  </h1>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${dailyChange >= 0
                        ? "bg-white/20 text-white"
                        : "bg-rose-500/30 text-rose-100"
                        }`}
                    >
                      <ArrowTrendIcon
                        className={`h-4 w-4 ${dailyChange >= 0 ? "" : "rotate-180"}`}
                      />
                      {dailyChange >= 0 ? "+" : ""}{formatMoney(dailyChange, preferredCurrency)} ({dailyChangePercent.toFixed(2)}%)
                    </span>
                    <span className="text-emerald-100/60 text-sm">today</span>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                  <StatCard
                    label="Investments"
                    value={formatMoney(totalInvestments, preferredCurrency)}
                    icon={<ChartIcon className="h-4 w-4" />}
                    color="purple"
                  />
                  <StatCard
                    label="Cash"
                    value={formatMoney(totalCash, preferredCurrency)}
                    icon={<BankIcon className="h-4 w-4" />}
                    color="blue"
                  />
                  <StatCard
                    label="Rising"
                    value={positiveHoldings.toString()}
                    icon={<TrendUpIcon className="h-4 w-4" />}
                    color="green"
                  />
                  <StatCard
                    label="Falling"
                    value={negativeHoldings.toString()}
                    icon={<TrendDownIcon className="h-4 w-4" />}
                    color="red"
                  />
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <ConnectBrokerageButton
                  label="Connect Brokerage"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                />
                <SyncPortfolioButton className="border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/15" />
                <ResetDataButton className="border-red-900/50 bg-red-900/10 hover:bg-red-900/30" />
                <ImportPortfolioButton
                  label="Import CSV"
                  className="bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
                />
                <Link href="/add-account">
                  <button className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                    <BankIcon className="h-4 w-4 text-emerald-600" />
                    Add Bank Account
                  </button>
                </Link>
                <Link href="/add-investment">
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15">
                    <PlusIcon className="h-4 w-4" />
                    Add Investment
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Two column layout for investments and accounts */}
          <div className="grid gap-8">
            {/* Accounts Section - takes 1 column */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                      <BankIcon className="h-4 w-4 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Accounts</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {accounts.length} accounts • {formatMoney(totalCash, "EUR")} total
                  </p>
                </div>
                <Link
                  href="/add-account"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:text-white"
                >
                  Add
                </Link>
              </div>

              <AccountsList accounts={accountsForClient} />
            </section>

            {/* Investments Section - takes 2 columns */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                      <ChartIcon className="h-4 w-4 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Investments</h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {holdingsWithCurrentPrice.length} holdings • {formatMoney(totalInvestments, "EUR")} total
                  </p>
                </div>
                <Link
                  href="/add-investment"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-purple-500/50 hover:text-white"
                >
                  Manage
                </Link>
              </div>

              <InvestmentsList holdings={holdingsWithCurrentPrice} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "purple" | "blue" | "green" | "red";
}) {
  const colors = {
    purple: "bg-purple-500/20 text-purple-300",
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-emerald-500/20 text-emerald-300",
    red: "bg-rose-500/20 text-rose-300",
  };

  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 min-w-[100px]">
      <div className={`inline-flex items-center justify-center rounded-lg p-1.5 ${colors[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-emerald-100/70 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
    </div>
  );
}

// Icons
function WalletIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
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

function PlusIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ChartIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
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

function TrendUpIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </svg>
  );
}

function TrendDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 17-8.5-8.5-5 5L2 7" />
      <path d="M16 17h6v-6" />
    </svg>
  );
}

async function fetchQuotesSafely(symbols: string[]) {
  if (symbols.length === 0) {
    return [];
  }

  try {
    const result = await fetchQuotesCached(symbols);
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
