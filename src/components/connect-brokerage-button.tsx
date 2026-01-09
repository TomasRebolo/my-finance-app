"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ConnectBrokerageButtonProps = {
    className?: string;
    label?: string;
};

export function ConnectBrokerageButton({
    className = "",
    label = "Connect Brokerage",
}: ConnectBrokerageButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleConnect = async () => {
        setIsLoading(true);
        try {
            // Step 1: Register user with SnapTrade (if not already registered)
            const registerResponse = await fetch("/api/snaptrade/register", {
                method: "POST",
            });

            if (!registerResponse.ok) {
                throw new Error("Failed to register with SnapTrade");
            }

            // Step 2: Get connection portal URL
            const urlResponse = await fetch("/api/snaptrade/connection-url", {
                method: "POST",
            });

            if (!urlResponse.ok) {
                throw new Error("Failed to generate connection URL");
            }

            const { redirectUrl } = await urlResponse.json();

            // Step 3: Open connection portal (in new window or redirect)
            window.location.href = redirectUrl;
        } catch (error) {
            console.error("Error connecting brokerage:", error);
            alert("Failed to connect brokerage. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleConnect}
            disabled={isLoading}
            className={`group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:shadow-blue-500/50 disabled:translate-y-0 disabled:opacity-50 ${className}`}
        >
            {isLoading ? (
                <>
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                    Connecting...
                </>
            ) : (
                <>
                    <LinkIcon className="h-4 w-4" />
                    {label}
                </>
            )}
        </button>
    );
}

function LinkIcon(props: React.ComponentProps<"svg">) {
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
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
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
