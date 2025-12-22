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
    <main className="p-8">
      <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">
        ← Back
      </Link>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <div className="mt-1 text-sm text-white/60">
            {account.bankConnection.institutionName} • {account.type.toUpperCase()}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-white/60">Balance</div>
          <div className="text-2xl font-semibold">
            {formatMoney(account.balance.toString(), account.currency)}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Recent transactions</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Merchant</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {account.transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-white/70" colSpan={4}>
                  No transactions.
                </td>
              </tr>
            ) : (
              account.transactions.map((t) => (
                <tr key={t.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white/70">
                    {t.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3 text-white/70">{t.merchant ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {formatMoney(t.amount.toString(), t.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
