import { prisma } from "@/server/db/prisma";

export default async function Home() {
  const userCount = await prisma.user.count();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">My Finance App</h1>
      <p className="mt-2 text-sm text-gray-600">
        Database connected ✅ Users: {userCount}
      </p>
    </main>
  );
}
