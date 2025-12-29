"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportPortfolioButtonProps = {
  className?: string;
  label?: string;
};

export function ImportPortfolioButton({
  className = "",
  label = "Import Portfolio",
}: ImportPortfolioButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // You will need to implement the API route at /api/portfolio/import
      // to handle the parsing of the CSV/XLSX file.
      const response = await fetch("/api/portfolio/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Upload failed");
      }

      router.refresh(); // Refresh the dashboard to show new data
    } catch (error) {
      console.error("Error importing portfolio:", error);
      alert("Failed to import portfolio. Please check the console for details.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      style={{ display: "none" }}
      />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/50 disabled:translate-y-0 disabled:opacity-50 ${className}`}
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <UploadIcon className="h-4 w-4" />
            {label}
          </>
        )}
      </button>
    </>
  );
}

function UploadIcon(props: React.ComponentProps<"svg">) {
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
        d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5M12 3v12m0 0 4-4m-4 4-4-4"
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
