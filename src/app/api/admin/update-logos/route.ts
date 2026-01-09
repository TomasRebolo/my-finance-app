
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import yahooFinance from "yahoo-finance2";

// Force dynamic to avoid caching
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const investments = await prisma.investment.findMany({
            where: {

                logoUrl: null,
            },
            take: 50, // Process in batches to avoid timeout
        });

        const updates = [];
        const errors = [];

        for (const investment of investments) {
            try {
                // Fetch profile
                const summary = await yahooFinance.quoteSummary(investment.symbol, { modules: ["assetProfile"] });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const website = (summary as any)?.assetProfile?.website;

                if (website) {
                    let domain = "";
                    try {
                        const url = new URL(website);
                        domain = url.hostname.replace("www.", "");
                    } catch {
                        // simple fallback if not a valid URL
                        domain = website.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
                    }

                    if (domain) {
                        const logoUrl = `https://logo.clearbit.com/${domain}`;
                        await prisma.investment.update({
                            where: { id: investment.id },

                            data: { logoUrl },
                        });
                        updates.push({ symbol: investment.symbol, logoUrl });
                    }
                }
            } catch (e) {
                console.error(`Error processing ${investment.symbol}`, e);
                errors.push({ symbol: investment.symbol, error: String(e) });
            }
        }

        return NextResponse.json({
            message: `Processed ${investments.length} investments`,
            updates,
            errors,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
