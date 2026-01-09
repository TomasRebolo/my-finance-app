"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ResetDataButtonProps = {
    className?: string;
};

export function ResetDataButton({ className = "" }: ResetDataButtonProps) {
    const [isResetting, setIsResetting] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!confirm("Are you sure you want to delete ALL holdings and brokerage connections? This will clear your entire portfolio.")) {
            return;
        }

        setIsResetting(true);
        try {
            const response = await fetch("/api/snaptrade/reset", {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Reset failed");
            }

            const result = await response.json();
            console.log("Reset completed:", result);

            // Refresh the page to show clear state
            router.refresh();
        } catch (error) {
            console.error("Error resetting data:", error);
            alert("Failed to reset data. Please try again.");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isResetting}
            className={`inline-flex items-center gap-2 rounded-full border border-red-900/50 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/20 hover:text-red-300 disabled:opacity-50 ${className}`}
            title="Delete all imported brokerage data"
        >
            {isResetting ? (
                <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                    Resetting...
                </>
            ) : (
                <>
                    <TrashIcon className="h-4 w-4" />
                    Reset Data
                </>
            )}
        </button>
    );
}

function TrashIcon(props: React.ComponentProps<"svg">) {
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
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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
