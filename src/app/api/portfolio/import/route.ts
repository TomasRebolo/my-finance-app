import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import Papa from "papaparse";
import * as xlsx from "xlsx";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/prisma";

type ParsedHolding = {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
};

// Data used for calculation
type TransactionRow = {
  date: string;
  action: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
};

const symbolKeys = ["Ticker", "Symbol", "Instrument", "Ticker Symbol"];
const nameKeys = ["Name", "Instrument name", "Company"];
const quantityKeys = ["Quantity", "No. of shares", "No. of Shares", "Shares", "Units"];
const priceKeys = [
  "Average price",
  "Average Price",
  "Price / share",
  "Price per share",
  "Price",
  "Cost/Share",
];
const currencyKeys = [
  "Currency",
  "Currency (Price / share)",
  "Currency (Average price)",
  "Currency (cost)",
  "Currency (Price)",
  "Currency (Price per share)",
];
const actionKeys = ["Action", "Type"];
const dateKeys = ["Time", "Date"];

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = file.name?.split(".").pop()?.toLowerCase();

  try {
    const holdings =
      extension === "csv"
        ? await parseCsv(file)
        : extension === "xlsx" || extension === "xls"
          ? await parseXls(file)
          : [];

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: "No holdings detected in the uploaded file." },
        { status: 400 }
      );
    }

    let imported = 0;
    for (const holding of holdings) {
      // Create/Update Investment Reference
      const investment = await prisma.investment.upsert({
        where: { symbol: holding.symbol },
        update: {
          name: holding.name || holding.symbol,
          currency: holding.currency,
        },
        create: {
          symbol: holding.symbol,
          name: holding.name || holding.symbol,
          currency: holding.currency,
        },
      });

      // Update User Holding
      // Note: We only upsert if quantity is not zero, or you might want to keep 0 quantity records
      await prisma.holding.upsert({
        where: {
          userId_investmentId: {
            userId: user.id,
            investmentId: investment.id,
          },
        },
        update: {
          quantity: new Prisma.Decimal(holding.quantity),
          price: new Prisma.Decimal(holding.price),
        },
        create: {
          userId: user.id,
          investmentId: investment.id,
          quantity: new Prisma.Decimal(holding.quantity),
          price: new Prisma.Decimal(holding.price),
        },
      });

      imported += 1;
    }

    revalidatePath("/dashboard");

    return NextResponse.json({ imported });
  } catch (error) {
    console.error("Failed to import portfolio", error);
    return NextResponse.json(
      { error: "Unable to import portfolio. Please check the file format." },
      { status: 500 }
    );
  }
}

async function parseCsv(file: File): Promise<ParsedHolding[]> {
  const text = await file.text();
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors.length > 0) {
    throw new Error("Failed to parse CSV");
  }

  return processTransactions(result.data);
}

async function parseXls(file: File): Promise<ParsedHolding[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return processTransactions(rows);
}

function processTransactions(rows: Record<string, unknown>[]): ParsedHolding[] {
  // 1. Normalize rows into a clean structure
  const transactions: TransactionRow[] = rows
    .map((row) => {
      const symbol = getString(row, symbolKeys);
      const name = getString(row, nameKeys) ?? symbol ?? "";
      const quantity = getNumber(row, quantityKeys);
      const price = getNumber(row, priceKeys) ?? 0;
      const currency = getString(row, currencyKeys) ?? "USD";
      const action = getString(row, actionKeys) ?? "Buy"; // Default to buy if missing
      const date = getString(row, dateKeys) ?? "";

      if (!symbol || quantity === null) {
        return null;
      }

      return { symbol, name, quantity, price, currency, action, date };
    })
    .filter((t): t is TransactionRow => t !== null);

  // 2. Sort by date ascending to calculate averages correctly
  transactions.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // 3. Aggregate holdings by symbol
  const holdingsMap = new Map<
    string,
    { quantity: number; costBasis: number; name: string; currency: string }
  >();

  for (const t of transactions) {
    const current = holdingsMap.get(t.symbol) || {
      quantity: 0,
      costBasis: 0,
      name: t.name,
      currency: t.currency,
    };

    const actionLower = t.action.toLowerCase();
    const isBuy = actionLower.includes("buy") || actionLower.includes("deposit");
    const isSell = actionLower.includes("sell") || actionLower.includes("withdraw");

    if (isBuy) {
      // Calculate Weighted Average Price
      // New Cost = (OldQty * OldCost + NewQty * NewPrice) / (OldQty + NewQty)
      const totalCost = current.quantity * current.costBasis + t.quantity * t.price;
      const newQuantity = current.quantity + t.quantity;
      
      current.quantity = newQuantity;
      current.costBasis = newQuantity !== 0 ? totalCost / newQuantity : 0;
    } else if (isSell) {
      // Selling reduces quantity but doesn't change cost basis (average buy price)
      current.quantity -= t.quantity;
    }

    // Update metadata if available
    if (t.name) current.name = t.name;
    if (t.currency) current.currency = t.currency;

    holdingsMap.set(t.symbol, current);
  }

  // 4. Convert map back to array
  return Array.from(holdingsMap.entries()).map(([symbol, data]) => ({
    symbol,
    name: data.name,
    quantity: data.quantity,
    price: data.costBasis, // We store the average buy price
    currency: data.currency,
  }));
}

function getString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value);
    }
  }
  return null;
}

function getNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = row[key];

    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }

    if (typeof raw === "string") {
      const cleaned = raw.replace(/,/g, "").trim();
      const parsed = Number(cleaned);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}