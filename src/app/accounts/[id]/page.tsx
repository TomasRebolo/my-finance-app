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
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {account.name}
            </h1>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {account.bankConnection.institutionName} •{" "}
              {account.type.toUpperCase()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance
            </div>
            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatMoney(account.balance.toString(), account.currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Recent transactions
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  Merchant
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {account.transactions.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    colSpan={4}
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                account.transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {t.date.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {t.description}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {t.merchant ?? "—"}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        Number(t.amount) > 0
                          ? "text-green-600"
                          : "text-red-600"
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
