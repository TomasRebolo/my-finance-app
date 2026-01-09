
import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import yahooFinance from "yahoo-finance2";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    adapter,
});

async function main() {
    while (true) {
        const investments = await (prisma.investment as any).findMany({
            where: {
                logoUrl: null,
            },
            take: 50, // Process in batches
        });

        if (investments.length === 0) {
            console.log("All investment logos are up to date.");
            break;
        }

        console.log(`Found ${investments.length} investments to update in this batch.`);

        for (const investment of investments) {
            try {
                console.log(`Processing ${investment.symbol}...`);

                // 1. Try to get website from Yahoo Finance
                const summary = await yahooFinance.quoteSummary(investment.symbol, { modules: ["assetProfile"] }) as any;

                const website = summary?.assetProfile?.website;

                if (website) {
                    // Extract domain
                    try {
                        const url = new URL(website);
                        const domain = url.hostname.replace("www.", "");
                        // The Clearbit Logo API is being sunset and is unavailable for new users.
                        // Switched to Brandfetch as a free alternative.
                        const logoUrl = `https://cdn.brandfetch.io/${domain}/logo.png`;

                        await (prisma.investment as any).update({
                            where: { id: investment.id },
                            data: { logoUrl },
                        });
                        console.log(`  Updated ${investment.symbol} with logo: ${logoUrl}`);
                    } catch (e) {
                        console.warn(`  Failed to parse website URL for ${investment.symbol}: ${website}`);
                    }
                } else {
                    console.log(`  No website found for ${investment.symbol}.`);
                }

                // Rate limiting to avoid hitting API limits
                await new Promise((resolve) => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`  Failed to update ${investment.symbol}:`, error instanceof Error ? error.message : String(error));
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
