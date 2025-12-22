import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Home() {
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
        <p className="mt-6 text-sm text-green-700">You are signed in ✅</p>
      </SignedIn>
    </main>
  );
}
