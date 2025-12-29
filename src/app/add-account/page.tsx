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
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Add Account
        </h1>
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Connect your bank account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Securely connect your bank account using Yapily to import your
            transactions and balances.
          </p>

          <div className="mt-8">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect Account"}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            By connecting your account, you agree to our{" "}
            <a href="#" className="font-medium hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium hover:underline">
              Privacy Policy
            </a>
            .
          </div>
        </div>
        <FileUpload />
      </div>
    </main>
  );
}
