import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import snaptradeClient, { getOrRegisterSnaptradeUser } from "@/server/snaptrade/client";

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

        // Check if already registered
        if (user.snaptradeUserId && user.snaptradeUserSecret) {
            return NextResponse.json({
                registered: true,
                userId: user.snaptradeUserId,
            });
        }

        // Register with SnapTrade using Clerk user ID
        const snaptradeUser = await getOrRegisterSnaptradeUser(clerkUserId);

        // Store SnapTrade credentials in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                snaptradeUserId: snaptradeUser.userId,
                snaptradeUserSecret: snaptradeUser.userSecret,
            },
        });

        return NextResponse.json({
            registered: true,
            userId: snaptradeUser.userId,
        });
    } catch (error) {
        console.error("Failed to register SnapTrade user:", error);
        return NextResponse.json(
            { error: "Failed to register user with SnapTrade" },
            { status: 500 }
        );
    }
}
