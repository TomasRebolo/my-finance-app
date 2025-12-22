import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ensureUser } from "@/server/auth/ensureUser";

export default async function Home() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Finance App</h1>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>

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

      <SignedIn>
        {/** This line is the important one */}
        <DbUserDebug />
      </SignedIn>
    </main>
  );
}

async function DbUserDebug() {
  const user = await ensureUser();
  return (
    <div className="mt-6 rounded border p-4 text-sm">
      <div><b>DB user id:</b> {user.id}</div>
      <div><b>Clerk user id:</b> {user.clerkUserId}</div>
      <div><b>Email:</b> {user.email ?? "—"}</div>
    </div>
  );
}
