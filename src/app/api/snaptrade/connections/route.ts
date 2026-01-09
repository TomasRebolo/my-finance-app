import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import snaptradeClient from "@/server/snaptrade/client";

// GET: List all brokerage connections
export async function GET() {
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
            return NextResponse.json({ connections: [] });
        }

        // Get connections from SnapTrade
        const response = await snaptradeClient.connections.listBrokerageAuthorizations({
            userId: user.snaptradeUserId,
            userSecret: user.snaptradeUserSecret,
        });

        const connections = response.data.map((conn: any) => ({
            id: conn.id,
            institutionName: conn.institution_name,
            createdDate: conn.created_date,
            disabled: conn.disabled,
            disabledDate: conn.disabled_date,
        }));

        return NextResponse.json({ connections });
    } catch (error: any) {
        console.error("Failed to list connections:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to list connections" },
            { status: 500 }
        );
    }
}

// DELETE: Remove a brokerage connection
export async function DELETE(request: NextRequest) {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const { authorizationId } = await request.json();

        if (!authorizationId) {
            return NextResponse.json(
                { error: "Authorization ID required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { clerkUserId } });
        if (!user || !user.snaptradeUserId || !user.snaptradeUserSecret) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete connection from SnapTrade
        await snaptradeClient.connections.removeBrokerageAuthorization({
            userId: user.snaptradeUserId,
            userSecret: user.snaptradeUserSecret,
            authorizationId,
        });

        // Delete from our database
        await prisma.brokerageConnection.deleteMany({
            where: {
                userId: user.id,
                snaptradeConnectionId: authorizationId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete connection:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to delete connection" },
            { status: 500 }
        );
    }
}
