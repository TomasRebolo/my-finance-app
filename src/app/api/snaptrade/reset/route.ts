import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function DELETE() {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        // Cast to any to avoid stale type errors in editor
        const user = await prisma.user.findUnique({ where: { clerkUserId } }) as any;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            const prismaTx = tx as any;

            // 1. Delete ALL holdings for the user
            // This is necessary because if a connection was previously deleted, the holdings might 
            // have been orphaned (brokerageAccountId set to null) and we can't distinguish them.
            // Since the user requested a reset, we clear the portfolio.
            await prismaTx.holding.deleteMany({
                where: { userId: user.id }
            });

            // 2. Delete the brokerage connections (cascades to accounts)
            // Even though holdings are gone, we still want to remove the connections
            await prismaTx.brokerageConnection.deleteMany({
                where: { userId: user.id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to reset SnapTrade data:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to reset data" },
            { status: 500 }
        );
    }
}
