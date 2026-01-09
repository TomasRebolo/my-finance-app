"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CurrencyToggle() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCurrency = searchParams.get("currency") || "EUR";

    const toggleCurrency = (currency: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("currency", currency);
        router.push(`?${params.toString()}`);
        router.refresh();
    };

    return (
        <div className="flex items-center rounded-lg bg-slate-800/50 p-1 border border-slate-700">
            <button
                onClick={() => toggleCurrency("EUR")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${currentCurrency === "EUR"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
            >
                EUR
            </button>
            <button
                onClick={() => toggleCurrency("USD")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${currentCurrency === "USD"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
            >
                USD
            </button>
        </div>
    );
}
