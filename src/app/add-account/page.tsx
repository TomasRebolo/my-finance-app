"use client";

import { useState } from "react";
import { getConsentUrl } from "@/server/actions/yapily";
import FileUpload from "@/components/FileUpload";

export default function AddAccountPage() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await getConsentUrl("modelo-sandbox");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/80">
              Inspired by getquin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Connect your bank in two steps
            </h1>
            <p className="mt-3 text-emerald-50/80">
              Cleaner, friendlier onboarding: choose your connector or import a CSV/XLSX from your broker.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md ring-1 ring-white/10">
              <h2 className="text-lg font-semibold">Link with Yapily</h2>
              <p className="mt-2 text-sm text-emerald-50/80">
                Secure OAuth-style flow. We never store your credentials, only the read-only tokens.
              </p>

              <ol className="mt-4 space-y-3 text-sm text-emerald-50/80">
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                    1
                  </span>
                  Pick your institution and confirm consent.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                    2
                  </span>
                  We sync balances and recent transactions in the background.
                </li>
              </ol>

              <button
                onClick={handleConnect}
                disabled={loading}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? "Connecting..." : "Connect via Yapily"}
              </button>

              <p className="mt-3 text-center text-xs text-emerald-50/80">
                By connecting your account, you agree to our{" "}
                <a href="#" className="font-semibold underline-offset-4 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold underline-offset-4 hover:underline">
                  Privacy Policy
                </a>.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/70 p-6 ring-1 ring-emerald-400/30">
              <h2 className="text-lg font-semibold text-white">Prefer a quick upload?</h2>
              <p className="mt-2 text-sm text-slate-300">
                Drop in broker exports (CSV/XLS/XLSX) to populate balances without waiting for a connection.
              </p>
              <FileUpload />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
