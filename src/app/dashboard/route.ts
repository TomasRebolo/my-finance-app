import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const text = await file.text();
    const { data } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    let count = 0;

    for (const row of data as any[]) {
      // Trading212 CSV headers
      const action = row["Action"];
      const ticker = row["Ticker"];
      const name = row["Name"];
      const quantityStr = row["No. of shares"];
      const priceStr = row["Price / share"];
      const currency = row["Currency (Price / share)"];

      // Check if it's a valid buy/sell row
      if (
        action &&
        (action.includes("buy") || action.includes("sell")) &&
        ticker &&
        quantityStr &&
        priceStr
      ) {
        let quantity = parseFloat(quantityStr.replace(",", "."));
        const price = parseFloat(priceStr.replace(",", "."));

        if (isNaN(quantity) || isNaN(price)) continue;

        // If it's a sell order, we treat it as negative quantity
        if (action.includes("sell")) {
          quantity = -quantity;
        }

        let investment = await db.investment.findUnique({
          where: { symbol: ticker },
        });

        if (!investment) {
          investment = await db.investment.create({
            data: {
              symbol: ticker,
              name: name || ticker,
              currency: currency || "USD",
            },
          });
        }

        await db.holding.create({
          data: {
            userId: user.id,
            investmentId: investment.id,
            quantity,
            price,
          },
        });
        count++;
      }
    }

    revalidatePath("/dashboard");
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Import error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}