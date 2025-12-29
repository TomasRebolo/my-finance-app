import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import yahooFinance from "yahoo-finance2";
import { ImportPortfolioButton } from "@/components/import-portfolio-button";
import { ensureUser } from "@/server/auth/ensureUser";

function formatMoney(value: string | number, currency: string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(n);
}

export default async function DashboardPage() {
  const user = await ensureUser();

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

  const accounts = await prisma.account.findMany({
    where: { bankConnection: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const symbols = userWithHoldings.holdings.map((h) => h.investment.symbol);
  const quotes = await fetchQuotesSafely(symbols);

  const holdingsWithCurrentPrice = userWithHoldings.holdings.map((holding) => {
    const quote = quotes.find((q) => q.symbol === holding.investment.symbol);
    const fallbackPrice = Number(holding.price) || 0;
    const currentPrice = quote?.regularMarketPrice ?? fallbackPrice;
    const change = quote?.regularMarketChange ?? 0;
    const currency = holding.investment.currency;

    const previousPrice = currentPrice - change;
    const percentageChange = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

    return {
      ...holding,
      currentPrice,
      change,
      percentageChange,
      currency,
    };
  });

  const totalInvestments = holdingsWithCurrentPrice.reduce(
    (sum, h) => sum + h.currentPrice * Number(h.quantity),
    0
  );
  const dailyChange = holdingsWithCurrentPrice.reduce(
    (sum, h) => sum + h.change * Number(h.quantity),
    0
  );
  const netWorth = total + totalInvestments;
  const positiveHoldings = holdingsWithCurrentPrice.filter((h) => h.change >= 0).length;
  const negativeHoldings = holdingsWithCurrentPrice.length - positiveHoldings;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_55%)] lg:block" />
          <div className="grid gap-8 md:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-wide text-emerald-50/80">
                Inspired by getquin&apos;s clean cockpit
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Your portfolio, beautifully organized
                </h1>
                <p className="mt-2 max-w-2xl text-emerald-50/80">
                  All bank balances, investments, and imports come together in a single, friendly view.
                  Quickly jump into actions without hunting through menus.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ImportPortfolioButton
                  label="Import CSV/XLSX"
                  className="bg-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25"
                />
                <Link href="/add-account">
                  <button className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-xl">
                    <BankIcon className="h-4 w-4 text-emerald-600" />
                    Add bank account
                  </button>
                </Link>
                <Link href="/add-investment">
                  <button className="group inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/60">
                    <PlusIcon className="h-4 w-4" />
                    Add investment
                  </button>
                </Link>
              </div>
            </div>
            <div className="grid gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur-md sm:grid-cols-2 sm:gap-5">
              <StatCard
                label="Net worth"
                value={formatMoney(netWorth, "EUR")}
                hint="Balances + investments"
              />
              <StatCard
                label="Cash on hand"
                value={formatMoney(total, "EUR")}
                hint="Across linked accounts"
              />
              <StatCard
                label="Invested"
                value={formatMoney(totalInvestments, "EUR")}
                hint={`${positiveHoldings} rising • ${negativeHoldings} falling`}
              />
              <StatCard
                label="Day change"
                value={`${dailyChange >= 0 ? "+" : ""}${formatMoney(
                  dailyChange,
                  "EUR"
                )}`}
                hint="Based on latest quotes"
                tone={dailyChange >= 0 ? "positive" : "negative"}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-400">
                Portfolio
              </p>
              <h2 className="text-2xl font-semibold text-white">Investments</h2>
              <p className="text-sm text-slate-400">
                Quick glance inspired by getquin: holdings grouped with live price deltas.
              </p>
            </div>
            <Link
              href="/add-investment"
              className="hidden rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white md:inline-flex"
            >
              Manage holdings
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {holdingsWithCurrentPrice.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                No investments yet. Import a CSV/XLSX or add one manually to see your cockpit come to life.
              </div>
            ) : (
              holdingsWithCurrentPrice.map((h) => {
                const positionValue = h.currentPrice * Number(h.quantity);
                return (
                  <div
                    key={h.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-emerald-400/50"
                  >
                    <div className="absolute inset-y-0 right-0 w-20 bg-[radial-gradient(circle_at_100%_50%,rgba(16,185,129,0.15),transparent_60%)]" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                          {h.investment.symbol}
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
                            {h.investment.currency}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {h.investment.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {Number(h.quantity).toLocaleString()} units @ {formatMoney(h.currentPrice, h.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Current value
                        </p>
                        <p className="text-xl font-semibold text-white">
                          {formatMoney(positionValue, h.currency)}
                        </p>
                        <p
                          className={`mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            h.change >= 0
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          <ArrowTrendIcon
                            className={`h-4 w-4 ${h.change >= 0 ? "rotate-0" : "rotate-180"}`}
                          />
                          {h.change.toFixed(2)} ({h.percentageChange.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-emerald-400">
                Cash &amp; accounts
              </p>
              <h2 className="text-2xl font-semibold text-white">Accounts</h2>
              <p className="text-sm text-slate-400">
                Mirror of getquin&apos;s card stack: balances with quick navigation into details.
              </p>
            </div>
            <Link
              href="/add-account"
              className="hidden rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-white md:inline-flex"
            >
              Add account
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                No accounts yet. Connect a bank or import a CSV to populate this view.
              </div>
            ) : (
              accounts.map((a) => (
                <Link
                  key={a.id}
                  href={`/accounts/${a.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:border-emerald-400/40"
                >
                  <div className="absolute inset-y-0 right-0 w-16 bg-[radial-gradient(circle_at_90%_30%,rgba(16,185,129,0.2),transparent_60%)]" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-800 p-3 text-emerald-300 shadow-inner shadow-black/20">
                        <BankIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {a.type}
                        </p>
                        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-200">
                          {a.name}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {a.currency} • updated automatically
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Balance
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {formatMoney(a.balance.toString(), a.currency)}
                      </p>
                      {a.availableBalance !== null && (
                        <p className="text-xs text-slate-400">
                          Available{" "}
                          <span className="font-semibold text-emerald-200">
                            {formatMoney(a.availableBalance.toString(), a.currency)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function BankIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "positive" | "negative";
}) {
  const toneClasses =
    tone === "positive"
      ? "text-emerald-200"
      : tone === "negative"
        ? "text-rose-200"
        : "text-white";
  return (
    <div className="rounded-xl bg-white/10 p-4 text-white shadow-inner shadow-black/10 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-emerald-50/80">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses}`}>{value}</p>
      <p className="text-sm text-emerald-50/70">{hint}</p>
    </div>
  );
}

function ArrowTrendIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17 9 11 13 15 21 7" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

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
