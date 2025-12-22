import { prisma } from "@/server/db/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function ensureUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

  return prisma.user.upsert({
    where: { clerkUserId: userId },
    update: { email: email ?? undefined },
    create: {
      clerkUserId: userId,
      email: email ?? undefined,
    },
  });
}

