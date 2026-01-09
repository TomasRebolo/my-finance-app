import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import snaptradeClient from "@/server/snaptrade/client";

export async function POST() {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { clerkUserId } }) as any;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.snaptradeUserId || !user.snaptradeUserSecret) {
            return NextResponse.json(
                { error: "User not registered with SnapTrade" },
                { status: 400 }
            );
        }

        // Get all accounts for this user
        const accountsResponse = await snaptradeClient.accountInformation.getAllUserHoldings({
            userId: user.snaptradeUserId,
            userSecret: user.snaptradeUserSecret,
        });

        const accounts = accountsResponse.data;
        const syncedHoldingIds = new Set<string>();
        let syncedHoldings = 0;
        let syncedAccounts = 0;

        // Using a transaction to ensure data consistency during the sync
        await prisma.$transaction(async (tx) => {
            // Cast transaction client to any to bypass stale type definition errors in editor
            // The underlying client is valid, but the TS server hasn't picked up the new schema
            const prismaTx = tx as any;

            // Process each account
            for (const accountData of accounts) {
                if (!accountData.account) continue;

                const account = accountData.account;

                let brokerageConnection = await prismaTx.brokerageConnection.findFirst({
                    where: {
                        userId: user.id,
                        institutionName: account.institution_name || "Unknown",
                    },
                });

                if (!brokerageConnection) {
                    brokerageConnection = await prismaTx.brokerageConnection.create({
                        data: {
                            userId: user.id,
                            snaptradeConnectionId: account.id || `conn-${Date.now()}`,
                            institutionName: account.institution_name || "Unknown",
                            status: "CONNECTED",
                            lastSyncedAt: new Date(),
                        },
                    });
                } else {
                    await prismaTx.brokerageConnection.update({
                        where: { id: brokerageConnection.id },
                        data: { lastSyncedAt: new Date() },
                    });
                }

                // Upsert brokerage account
                const brokerageAccount = await prismaTx.brokerageAccount.upsert({
                    where: { snaptradeAccountId: account.id! },
                    update: {
                        name: account.name || account.number || "Unnamed Account",
                        type: account.meta?.type || "Investment",
                        number: account.number,
                        currency: account.balance?.currency || "USD",
                        balance: new Prisma.Decimal(account.balance?.amount || 0),
                    },
                    create: {
                        brokerageConnectionId: brokerageConnection.id,
                        snaptradeAccountId: account.id!,
                        name: account.name || account.number || "Unnamed Account",
                        type: account.meta?.type || "Investment",
                        number: account.number,
                        currency: account.balance?.currency || "USD",
                        balance: new Prisma.Decimal(account.balance?.amount || 0),
                    },
                });

                syncedAccounts++;

                // Process holdings/positions for this account
                const positions = accountData.positions || [];

                for (const position of positions) {
                    if (!position.symbol) continue;

                    // Handle UniversalSymbol type - SDK might return an object where we expect a string
                    // Based on types, position.symbol.symbol is a UniversalSymbol object, not a string
                    const symbolObj = position.symbol.symbol as any;
                    const symbolStr = (typeof symbolObj === 'string' ? symbolObj : symbolObj?.symbol || position.symbol.description) as string;

                    if (!symbolStr) continue;

                    const quantity = position.units || 0;
                    const price = position.price || 0;
                    const currency = position.symbol.currency?.code || "USD";

                    // Skip if quantity is 0, these will be pruned later
                    if (quantity === 0) continue;

                    // Upsert investment
                    // Find or create investment manually to avoid FK constraint violations with upsert
                    let investment = await prismaTx.investment.findUnique({
                        where: { symbol: symbolStr },
                    });

                    if (investment) {
                        investment = await prismaTx.investment.update({
                            where: { id: investment.id },
                            data: {
                                name: position.symbol.description || symbolStr,
                                currency: currency,
                                lastPrice: new Prisma.Decimal(price),
                            },
                        });
                    } else {
                        investment = await prismaTx.investment.create({
                            data: {
                                symbol: symbolStr,
                                name: position.symbol.description || symbolStr,
                                currency: currency,
                                lastPrice: new Prisma.Decimal(price),
                            },
                        });
                    }

                    // Upsert holding.
                    // WARNING: The current unique key `userId_investmentId` can lead to data corruption
                    // if a user holds the same investment in multiple accounts. This upsert will overwrite
                    // the holding from the first account with the details from the second account.
                    //
                    // TODO: To fix this, change the schema for the `Holding` model to:
                    // `@@unique([brokerageAccountId, investmentId])`
                    //
                    // After updating the schema and running `prisma generate`, change the `where` clause below to:
                    // where: {
                    //   brokerageAccountId_investmentId: {
                    //     brokerageAccountId: brokerageAccount.id,
                    //     investmentId: investment.id,
                    //   }
                    // }
                    const holding = await prismaTx.holding.upsert({
                        where: {
                            userId_investmentId: {
                                userId: user.id,
                                investmentId: investment.id,
                            },
                        },
                        update: {
                            quantity: new Prisma.Decimal(quantity),
                            price: new Prisma.Decimal(price),
                            brokerageAccountId: brokerageAccount.id,
                        },
                        create: {
                            userId: user.id,
                            investmentId: investment.id,
                            brokerageAccountId: brokerageAccount.id,
                            quantity: new Prisma.Decimal(quantity),
                            price: new Prisma.Decimal(price),
                        },
                    });
                    syncedHoldingIds.add(holding.id);
                }
            }

            // Delete stale holdings for the user that are no longer present in SnapTrade's response
            const userBrokerageConnections = await prismaTx.brokerageConnection.findMany({
                where: { userId: user.id },
                select: { brokerageAccounts: { select: { id: true } } },
            });
            const userBrokerageAccountIds = userBrokerageConnections.flatMap((conn: any) => conn.brokerageAccounts.map((acc: any) => acc.id));

            await prismaTx.holding.deleteMany({
                where: {
                    brokerageAccountId: { in: userBrokerageAccountIds },
                    id: { notIn: Array.from(syncedHoldingIds) },
                },
            });
        });

        return NextResponse.json({
            success: true,
            syncedAccounts,
            syncedHoldings: syncedHoldingIds.size,
        });
    } catch (error: any) {
        console.error("Failed to sync portfolio:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to sync portfolio" },
            { status: 500 }
        );
    }
}
