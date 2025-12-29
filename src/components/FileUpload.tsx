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
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-dashed border-emerald-500/40 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-inner shadow-black/20">
        <p className="font-semibold text-white">Import from CSV/XLSX</p>
        <p className="mt-1 text-slate-400">
          Upload broker exports and we&apos;ll reconcile holdings and cash—mirroring getquin&apos;s smooth import flow.
        </p>
        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:border-emerald-400 hover:bg-emerald-500/20">
          <span>{file ? file.name : "Choose a CSV/XLSX file"}</span>
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs text-white">
            Browse
          </span>
          <input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <p className="mt-2 text-xs text-slate-400">
          Supported: .csv, .xls, .xlsx • We never share your files.
        </p>
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-500/50 disabled:translate-y-0 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload and import"}
      </button>

      {error && <div className="text-sm text-rose-300">{error}</div>}

      {success && <div className="text-sm text-emerald-200">{success}</div>}
    </div>
  );
}
