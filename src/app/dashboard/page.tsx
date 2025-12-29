import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import yahooFinance from "yahoo-finance2";

function formatMoney(value: string | number, currency: string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(n);
}

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      holdings: {
        include: {
          investment: true,
        },
      },
    },
  });
  if (!user) redirect("/");

  const accounts = await prisma.account.findMany({
    where: { bankConnection: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const symbols = user.holdings.map((h) => h.investment.symbol);
  const quotes = await yahooFinance.quote(symbols);

  const holdingsWithCurrentPrice = user.holdings.map((holding) => {
    const quote = quotes.find((q) => q.symbol === holding.investment.symbol);
    return {
      ...holding,
      currentPrice: quote?.regularMarketPrice ?? 0,
      change: quote?.regularMarketChange ?? 0,
    };
  });

  const totalInvestments = holdingsWithCurrentPrice.reduce(
    (sum, h) => sum + h.currentPrice * Number(h.quantity),
    0
  );

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>

        <div className="flex gap-2">
          <Link href="/add-account">
            <button className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              Add Bank Account
            </button>
          </Link>
          <Link href="/add-investment">
            <button className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
              Add Investment
            </button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total balance
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatMoney(total, "EUR")}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Investments
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatMoney(totalInvestments, "EUR" )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Investments
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4">
          {holdingsWithCurrentPrice.length === 0 ? (
            <div className="col-span-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No investments yet. Click &quot;Add Investment&quot; to get started.
            </div>
          ) : (
            holdingsWithCurrentPrice.map((h) => (
              <div
                key={h.id}
                className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{h.investment.symbol}</div>
                    <div className="text-sm text-gray-500">{h.investment.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatMoney(h.currentPrice * Number(h.quantity), h.investment.currency)}
                    </div>
                    <div className={`text-sm ${h.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {h.change.toFixed(2)} ({((h.change / (h.currentPrice - h.change)) * 100).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Accounts
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.length === 0 ? (
            <div className="col-span-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No accounts yet. Click &quot;Add Bank Account&quot; to get started.
            </div>
          ) : (
            accounts.map((a) => (
              <Link
                key={a.id}
                href={`/accounts/${a.id}`}
                className="rounded-lg bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-700">
                      <BankIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {a.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {a.type.toUpperCase()} • {a.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatMoney(a.balance.toString(), a.currency)}
                    </div>
                    {a.availableBalance !== null && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Available:{" "}
                        {formatMoney(
                          a.availableBalance.toString(),
                          a.currency
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
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
