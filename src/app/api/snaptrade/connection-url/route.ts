import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

        // Ensure user is registered with SnapTrade
        if (!user.snaptradeUserId || !user.snaptradeUserSecret) {
            return NextResponse.json(
                { error: "User not registered with SnapTrade" },
                { status: 400 }
            );
        }

        // Generate connection portal URL
        const response = await snaptradeClient.authentication.loginSnapTradeUser({
            userId: user.snaptradeUserId,
            userSecret: user.snaptradeUserSecret,
            broker: undefined, // Let user choose broker
            immediateRedirect: true,
            customRedirect: process.env.SNAPTRADE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/snaptrade/callback`,
            reconnect: undefined,
            connectionType: "read" as any, // Read-only access
            connectionPortalVersion: "v3" as any,
        });

        return NextResponse.json({
            redirectUrl: response.data.redirectURI,
        });
    } catch (error: any) {
        console.error("Failed to generate connection URL:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate connection URL" },
            { status: 500 }
        );
    }
}
