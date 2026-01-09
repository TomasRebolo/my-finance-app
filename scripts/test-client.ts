
import 'dotenv/config';
import { PrismaClient } from "@prisma/client";

async function main() {
    try {
        const prisma = new PrismaClient({ log: ['info'] });

        const investment = await prisma.investment.findFirst({
            select: {
                symbol: true,
                logoUrl: true
            }
        });
        console.log("Investment:", investment);
    } catch (e: any) {
        console.error("ERROR NAME:", e.name);
        console.error("ERROR MESSAGE:", e.message);
    }
}

main();
