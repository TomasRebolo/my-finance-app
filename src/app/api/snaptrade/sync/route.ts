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
        const user = await prisma.user.findUnique({ where: { clerkUserId } });
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
        let syncedHoldings = 0;
        let syncedAccounts = 0;

        // Process each account
        for (const accountData of accounts) {
            if (!accountData.account) continue;

            const account = accountData.account;

            // Get or create brokerage connection
            let brokerageConnection = await prisma.brokerageConnection.findFirst({
                where: {
                    userId: user.id,
                    institutionName: account.institution_name || "Unknown",
                },
            });

            if (!brokerageConnection) {
                brokerageConnection = await prisma.brokerageConnection.create({
                    data: {
                        userId: user.id,
                        snaptradeConnectionId: account.id || `conn-${Date.now()}`,
                        institutionName: account.institution_name || "Unknown",
                        status: "CONNECTED",
                        lastSyncedAt: new Date(),
                    },
                });
            } else {
                await prisma.brokerageConnection.update({
                    where: { id: brokerageConnection.id },
                    data: { lastSyncedAt: new Date() },
                });
            }

            // Upsert brokerage account
            const brokerageAccount = await prisma.brokerageAccount.upsert({
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
                if (!position.symbol || !position.symbol.symbol) continue;

                const symbol = position.symbol.symbol;
                const quantity = position.units || 0;
                const price = position.price || 0;
                const currency = position.symbol.currency?.code || "USD";

                // Skip if quantity is 0
                if (quantity === 0) continue;

                // Upsert investment
                const investment = await prisma.investment.upsert({
                    where: { symbol },
                    update: {
                        name: position.symbol.description || symbol,
                        currency: currency,
                        lastPrice: new Prisma.Decimal(price),
                    },
                    create: {
                        symbol,
                        name: position.symbol.description || symbol,
                        currency: currency,
                        lastPrice: new Prisma.Decimal(price),
                    },
                });

                // Upsert holding
                await prisma.holding.upsert({
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

                syncedHoldings++;
            }
        }

        return NextResponse.json({
            success: true,
            syncedAccounts,
            syncedHoldings,
        });
    } catch (error: any) {
        console.error("Failed to sync portfolio:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to sync portfolio" },
            { status: 500 }
        );
    }
}
