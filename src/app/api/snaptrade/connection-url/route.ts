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
        const user = await prisma.user.findUnique({ where: { clerkUserId } }) as any;
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

        // The response data is a union type, we need to access the redirectURI property
        const redirectUrl = (response.data as any).redirectURI || (response.data as any).redirect_uri;

        if (!redirectUrl) {
            console.error('No redirect URL in response:', response.data);
            throw new Error('Invalid response from SnapTrade - missing redirect URL');
        }

        return NextResponse.json({
            redirectUrl,
        });
    } catch (error: any) {
        console.error("Failed to generate connection URL:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate connection URL" },
            { status: 500 }
        );
    }
}
