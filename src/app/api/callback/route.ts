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
  // In your case, this "oneTimeToken" is actually the final Consent Token
  const consentToken = searchParams.get("consent"); 
  const institutionId = searchParams.get("institution");

  if (!consentToken) {
    throw new Error("No consent token found in callback URL.");
  }

  if (!institutionId) {
    throw new Error("No institution ID found in callback URL.");
  }

  const user = await ensureUser();
  
  // 1. Create the Bank Connection immediately
  const bankConnection = await prisma.bankConnection.create({
    data: {
      userId: user.id,
      provider: "yapily",
      providerItemId: consentToken,
      consentId: consentToken,
      institutionId,
      institutionName: "Modelo Sandbox", 
      accessToken: consentToken, 
    },
  });

  // 2. Fetch Accounts using the token directly
  // NOTE: We use the header "Consent", not "consent-token"
  const accountsResponse = await fetch("https://api.yapily.com/accounts", {
    headers: {
      "Content-Type": "application/json",
      "Consent": consentToken, 
      "Authorization": `Basic ${btoa(`${process.env.YAPILY_API_KEY}:${process.env.YAPILY_API_SECRET}`)}`,
    },
  });

  if (!accountsResponse.ok) {
    const error = await accountsResponse.json();
    console.error("Error fetching accounts:", error);
    // Don't throw here, just redirect so the UI doesn't crash
    return redirect("/dashboard?error=fetch_failed");
  }

  const accounts = await accountsResponse.json();

  for (const account of accounts.data) {
    // Save Account
    const createdAccount = await prisma.account.create({
      data: {
        bankConnectionId: bankConnection.id,
        providerAccountId: account.id,
        name: account.accountNames?.[0]?.name || "Unknown Account",
        type: account.accountType,
        currency: account.currency,
        balance: account.balance || 0,
      },
    });

    // 3. Fetch Transactions
    const transactionsResponse = await fetch(
      `https://api.yapily.com/accounts/${account.id}/transactions`,
      {
        headers: {
          "Content-Type": "application/json",
          "Consent": consentToken,
          "Authorization": `Basic ${btoa(`${process.env.YAPILY_API_KEY}:${process.env.YAPILY_API_SECRET}`)}`,
        },
      }
    );

    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      
      // Save Transactions
      // Yapily returns { data: [...] }
      if (transactions.data) {
        await prisma.transaction.createMany({
          data: transactions.data.map((t: any) => ({
            accountId: createdAccount.id,
            providerTransactionId: t.id,
            amount: t.transactionAmount.amount, // Note: structure is usually transactionAmount.amount
            currency: t.transactionAmount.currency,
            description: t.description || "No description",
            date: new Date(t.bookingDate || t.date), // Use bookingDate if available
          })),
        });
      }
    }
  }

  redirect("/dashboard");
}