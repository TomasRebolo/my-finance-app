import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto max-w-7xl px-6 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <WalletIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">WealthView</span>
            </div>
            <SignedOut>
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            </SignedOut>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-300">
                <SparkleIcon className="h-4 w-4" />
                <span>Your complete financial picture</span>
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                All your finances,{" "}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  one dashboard
                </span>
              </h1>

              <p className="max-w-xl text-lg text-slate-400 leading-relaxed">
                Connect your bank accounts, import stock portfolios, and track your entire net worth
                in real-time. Make smarter financial decisions with complete visibility.
              </p>

              <SignedOut>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/sign-up"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40"
                  >
                    Start for free
                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:border-slate-500"
                  >
                    Sign in to dashboard
                  </Link>
                </div>
              </SignedOut>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <ShieldIcon className="h-5 w-5 text-emerald-400" />
                  <span>Bank-level security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <LockIcon className="h-5 w-5 text-emerald-400" />
                  <span>Read-only access</span>
                </div>
              </div>
            </div>

            {/* Feature preview cards */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                {/* Portfolio card */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm uppercase tracking-wide text-slate-400">Total Portfolio</span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span>
                  </div>
                  <p className="text-4xl font-bold text-white">€247,892.45</p>
                  <p className="mt-1 text-sm text-emerald-400">+€1,234.56 (+0.50%) today</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stocks card */}
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                      <ChartIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Investments</p>
                    <p className="mt-1 text-xl font-bold text-white">€182,450</p>
                    <p className="text-xs text-emerald-400">+2.3% this week</p>
                  </div>

                  {/* Bank card */}
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-xl">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                      <BankIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Cash</p>
                    <p className="mt-1 text-xl font-bold text-white">€65,442</p>
                    <p className="text-xs text-slate-400">3 accounts</p>
                  </div>
                </div>

                {/* Mini stock list */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 backdrop-blur-xl">
                  <div className="space-y-3">
                    {[
                      { symbol: "AAPL", name: "Apple Inc.", price: "€189.42", change: "+1.2%" },
                      { symbol: "MSFT", name: "Microsoft", price: "€378.91", change: "+0.8%" },
                      { symbol: "GOOGL", name: "Alphabet", price: "€141.80", change: "-0.3%" },
                    ].map((stock) => (
                      <div key={stock.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-xs font-bold text-white">
                            {stock.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{stock.symbol}</p>
                            <p className="text-xs text-slate-400">{stock.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{stock.price}</p>
                          <p className={`text-xs ${stock.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {stock.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Everything you need to track your wealth
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Aggregate all your financial data in one secure place
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BankIcon,
                iconBg: "bg-blue-500/20",
                iconColor: "text-blue-400",
                title: "Bank Account Sync",
                description: "Connect via Yapily to automatically sync balances and transactions from all your bank accounts.",
              },
              {
                icon: ChartIcon,
                iconBg: "bg-purple-500/20",
                iconColor: "text-purple-400",
                title: "Stock Portfolio Import",
                description: "Import your investment portfolios from any broker using CSV or Excel exports.",
              },
              {
                icon: PieChartIcon,
                iconBg: "bg-emerald-500/20",
                iconColor: "text-emerald-400",
                title: "Real-time Valuation",
                description: "Get live stock prices and see your total net worth update in real-time.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8 transition hover:border-slate-600 hover:bg-slate-800/50"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-12 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to take control of your finances?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
                Join thousands of users who have gained complete visibility into their financial health.
              </p>
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Create your free account
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </SignedOut>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto max-w-7xl px-6 py-12 border-t border-slate-800">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                <WalletIcon className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="font-semibold text-white">WealthView</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 WealthView. Your data stays yours.
            </p>
          </div>
        </footer>
      </div>
    </main>
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

function ArrowRightIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SparkleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function ShieldIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function ChartIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function PieChartIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
