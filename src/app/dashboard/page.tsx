import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { mockSync } from "@/server/actions/mockSync";

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
  });
  if (!user) redirect("/");

  const accounts = await prisma.account.findMany({
    where: { bankConnection: { userId: user.id } },
    orderBy: { createdAt: "desc" },
  });

  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <form
            action={async () => {
            "use server";
            await mockSync();
            redirect("/dashboard");
            }}
        >
          <button className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15">
            Mock Sync
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-white/10 p-4">
        <div className="text-sm text-white/70">Total balance</div>
        <div className="mt-1 text-2xl font-semibold">
          {formatMoney(total, "EUR")}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Accounts</h2>
      <div className="mt-3 grid gap-3">
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-white/10 p-4 text-white/70">
            No accounts yet. Click <span className="text-white">Mock Sync</span>.
          </div>
        ) : (
          accounts.map((a) => (
            <Link
              key={a.id}
              href={`/accounts/${a.id}`}
              className="rounded-lg border border-white/10 p-4 hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-white/60">
                    {a.type.toUpperCase()} • {a.currency}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatMoney(a.balance.toString(), a.currency)}
                  </div>
                  {a.availableBalance !== null && (
                    <div className="text-sm text-white/60">
                      Available:{" "}
                      {formatMoney(a.availableBalance.toString(), a.currency)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
