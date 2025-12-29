import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";

function formatMoney(value: string | number, currency: string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(n);
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) redirect("/");

  const account = await prisma.account.findFirst({
    where: {
      id,
      bankConnection: { userId: user.id },
    },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 50,
      },
      bankConnection: true,
    },
  });

  if (!account) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center gap-3 text-sm text-emerald-200">
          <ArrowLeftIcon className="h-5 w-5" />
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 font-semibold transition hover:border-emerald-400 hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">
                Account overview
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {account.name}
              </h1>
              <div className="mt-1 text-sm text-emerald-50/80">
                {account.bankConnection.institutionName} • {account.type.toUpperCase()}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 text-right backdrop-blur-md ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-wide text-emerald-50/80">Balance</p>
              <p className="text-3xl font-semibold text-white">
                {formatMoney(account.balance.toString(), account.currency)}
              </p>
              {account.availableBalance !== null && (
                <p className="text-sm text-emerald-50/80">
                  Available:{" "}
                  <span className="font-semibold text-white">
                    {formatMoney(account.availableBalance.toString(), account.currency)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-400">Activity</p>
              <h2 className="text-xl font-semibold text-white">Recent transactions</h2>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300">
              Last {account.transactions.length} items
            </span>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Description</th>
                  <th className="px-6 py-3 text-left font-semibold">Merchant</th>
                  <th className="px-6 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {account.transactions.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-slate-400"
                      colSpan={4}
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  account.transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/60">
                      <td className="px-6 py-4 text-slate-300">
                        {t.date.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {t.description}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {t.merchant ?? "—"}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          Number(t.amount) > 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {formatMoney(t.amount.toString(), t.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function ArrowLeftIcon(props: React.ComponentProps<"svg">) {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}
