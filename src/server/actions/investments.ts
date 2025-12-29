"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/server/db/prisma";
import { revalidatePath } from "next/cache";

interface AddHoldingArgs {
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  price: number;
}

export async function addHolding({
  symbol,
  name,
  currency,
  quantity,
  price,
}: AddHoldingArgs) {
  const user = await currentUser();

  if (!user) {
    throw new Error("You must be logged in to add a holding.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
  });

  if (!dbUser) {
    throw new Error("User not found.");
  }

  let investment = await prisma.investment.findUnique({
    where: { symbol },
  });

  if (!investment) {
    investment = await prisma.investment.create({
      data: {
        symbol,
        name,
        currency,
      },
    });
  }

  await prisma.holding.create({
    data: {
      userId: dbUser.id,
      investmentId: investment.id,
      quantity,
      price,
    },
  });

  revalidatePath("/dashboard");
}
