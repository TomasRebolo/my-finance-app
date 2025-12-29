import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { ensureUser } from "@/server/auth/ensureUser";
import { prisma } from "@/server/db/prisma";

type YapilyTransaction = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oneTimeToken = searchParams.get("consent");
  const institutionId = searchParams.get("institution");

  if (!oneTimeToken) {
    throw new Error("No one-time token found in callback URL.");
  }

  if (!institutionId) {
    throw new Error("No institution ID found in callback URL.");
  }

  const user = await ensureUser();

  const apiKey = process.env.YAPILY_API_KEY;
  const apiSecret = process.env.YAPILY_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Yapily API key and secret are not configured.");
  }

  const response = await fetch(
    "https://api.yapily.com/consent-one-time-token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      },
      body: JSON.stringify({ oneTimeToken }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Error exchanging one-time token:", error);
    throw new Error("Could not exchange one-time token.");
  }

  const { consentToken } = await response.json();

  const bankConnection = await prisma.bankConnection.create({
    data: {
      userId: user.id,
      provider: "yapily",
      providerItemId: consentToken,
      consentId: consentToken,
      institutionId,
      institutionName: "Unknown Institution", // We need a way to get this
      accessToken: consentToken, // For Yapily, the consent token is the access token
    },
  });

  const accountsResponse = await fetch("https://api.yapily.com/accounts", {
    headers: {
      "Content-Type": "application/json",
      "consent-token": consentToken,
      Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
    },
  });

  if (!accountsResponse.ok) {
    const error = await accountsResponse.json();
    console.error("Error fetching accounts:", error);
    throw new Error("Could not fetch accounts.");
  }

  const accounts = await accountsResponse.json();

  for (const account of accounts.data) {
    const createdAccount = await prisma.account.create({
      data: {
        bankConnectionId: bankConnection.id,
        providerAccountId: account.id,
        name: account.description,
        type: account.accountType,
        currency: account.currency,
        balance: account.balance,
      },
    });

    const transactionsResponse = await fetch(
      `https://api.yapily.com/accounts/${account.id}/transactions`,
      {
        headers: {
          "Content-Type": "application/json",
          "consent-token": consentToken,
          Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
        },
      }
    );

    if (!transactionsResponse.ok) {
      const error = await transactionsResponse.json();
      console.error(
        `Error fetching transactions for account ${account.id}:`,
        error
      );
      continue;
    }

    const transactions = (await transactionsResponse.json()) as {
      data: YapilyTransaction[];
    };

    await prisma.transaction.createMany({
      data: transactions.data.map((t) => ({
        accountId: createdAccount.id,
        providerTransactionId: t.id,
        amount: t.amount,
        currency: t.currency,
        description: t.description,
        date: new Date(t.date),
      })),
    });
  }

  redirect("/dashboard");
}
