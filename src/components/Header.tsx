"use client";

import React from "react";
import { FileSpreadsheet, Download, ShieldCheck } from "lucide-react";
import { downloadSampleExcel } from "@/lib/sampleData";

export default function Header() {
  const handleDownloadSample = () => {
    downloadSampleExcel();
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 text-lg">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                ANASTOMOSIS ENTERPRISE LLP
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                Production Ready
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Delivery Challan & PDF Generation Engine &bull; Client: M/S. Reliance Industries Limited
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadSample}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Download a pre-formatted Excel template with sample challans"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Download Sample Excel</span>
            <Download className="w-3 h-3 text-zinc-400" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Strict Empty-Field Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
}
