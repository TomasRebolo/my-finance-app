import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">My Finance App</h1>
      <SignedOut>
        <div className="mt-6 flex gap-3">
          <Link className="px-4 py-2 rounded border" href="/sign-in">
            Sign in
          </Link>
          <Link className="px-4 py-2 rounded border" href="/sign-up">
            Create account
          </Link>
        </div>
      </SignedOut>
    </main>
  );
}
