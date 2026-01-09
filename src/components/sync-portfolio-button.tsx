"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SyncPortfolioButtonProps = {
    className?: string;
};

export function SyncPortfolioButton({ className = "" }: SyncPortfolioButtonProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch("/api/snaptrade/sync", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Sync failed");
            }

            const result = await response.json();
            console.log("Sync completed:", result);

            // Refresh the page to show updated data
            router.refresh();
        } catch (error) {
            console.error("Error syncing portfolio:", error);
            alert("Failed to sync portfolio. Please try again.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:text-white disabled:opacity-50 ${className}`}
            title="Sync holdings from connected brokerages"
        >
            {isSyncing ? (
                <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                    Syncing...
                </>
            ) : (
                <>
                    <SyncIcon className="h-4 w-4" />
                    Sync
                </>
            )}
        </button>
    );
}

function SyncIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
        </svg>
    );
}

function SpinnerIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8v4l3.5-3.5A8 8 0 1 1 4 12Z"
            ></path>
        </svg>
    );
}
