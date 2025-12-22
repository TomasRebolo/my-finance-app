"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/server/db/prisma";
import { revalidatePath } from "next/cache";

export async function mockSync() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (!user) throw new Error("User not found in DB");

  const connection = await prisma.bankConnection.create({
    data: {
      userId: user.id,
      provider: "mock",
      providerItemId: `mock_${Date.now()}`,
      institutionName: "Mock Bank",
      institutionId: "mock_bank",
      accessToken: "mock_access_token",
      refreshToken: "mock_refresh_token",
      lastSyncedAt: new Date(),
    },
  });

  await prisma.account.createMany({
    data: [
      {
        bankConnectionId: connection.id,
        providerAccountId: `mock_acc_checking_${Date.now()}`,
        name: "Main Checking",
        type: "checking",
        currency: "EUR",
        balance: "2450.25",
        availableBalance: "2300.25",
      },
      {
        bankConnectionId: connection.id,
        providerAccountId: `mock_acc_savings_${Date.now()}`,
        name: "Savings",
        type: "savings",
        currency: "EUR",
        balance: "10450.0",
        availableBalance: "10450.0",
      },
    ],
  });

  const createdAccounts = await prisma.account.findMany({
    where: { bankConnectionId: connection.id },
    orderBy: { createdAt: "asc" },
  });

  const checking = createdAccounts[0];
  if (checking) {
    const now = new Date();

    const txs = Array.from({ length: 60 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const isExpense = i % 3 !== 0;
      const amount = isExpense ? -(5 + (i % 20) * 3.25) : 150 + (i % 5) * 25;

      return {
        accountId: checking.id,
        providerTransactionId: `mock_tx_${Date.now()}_${i}`,
        amount: amount.toFixed(2),
        currency: "EUR",
        description: isExpense ? "Card Purchase" : "Salary / Transfer",
        category: isExpense ? "shopping" : "income",
        merchant: isExpense ? ["Continente", "Pingo Doce", "Uber", "Amazon"][i % 4] : null,
        date: d,
        pending: false,
      };
    });

    await prisma.transaction.createMany({ data: txs });
  }

  // ✅ important: force dashboard to refetch
  revalidatePath("/dashboard");

  return { ok: true, connectionId: connection.id };
}
