"use client";

import { useState } from "react";
import { importFile } from "@/server/actions/import";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await importFile(formData);
      setSuccess("File imported successfully!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during file import.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Import from CSV/XLS
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Alternatively, you can upload a CSV or XLS file with your transactions.
      </p>

      <div className="mt-4">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full rounded-md bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload and Import"}
        </button>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 text-sm text-green-600">
          {success}
        </div>
      )}
    </div>
  );
}
