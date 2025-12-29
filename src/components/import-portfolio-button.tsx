"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportPortfolioButton() {
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
        className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? "Importing..." : "Import Portfolio"}
      </button>
    </>
  );
}