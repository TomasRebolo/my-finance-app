import { prisma } from "@/server/db/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth(); // 👈 IMPORTANT
  const userCount = await prisma.user.count();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">My Finance App</h1>

      <p className="mt-2 text-sm text-gray-600">
        Database connected ✅ Users: {userCount}
      </p>

      <p className="mt-2 text-sm">
        Auth status:{" "}
        {userId ? (
          <span className="text-green-600">Signed in</span>
        ) : (
          <span className="text-red-600">Not signed in</span>
        )}
      </p>

      {userId && (
        <p className="mt-1 text-xs text-gray-500">
          Clerk userId: {userId}
        </p>
      )}
    </main>
  );
}
