"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import BatchUploadView from "@/components/BatchUploadView";
import ManualEntryForm from "@/components/ManualEntryForm";
import TaxInvoiceBatchUploadView from "@/components/TaxInvoiceBatchUploadView";
import TaxInvoiceManualEntryForm from "@/components/TaxInvoiceManualEntryForm";
import MasterTemplateBatchView from "@/components/MasterTemplateBatchView";
import { InvoiceData } from "@/types/invoice";
import { TaxInvoiceData } from "@/types/taxInvoice";
import {
  FileSpreadsheet,
  FileEdit,
  CheckCircle2,
  FileCheck,
  Building2,
  Sparkles,
  Info,
  Truck,
  ReceiptText,
  Layers,
} from "lucide-react";

export default function Home() {
  const [docType, setDocType] = useState<"challan" | "invoice">("challan");
  const [activeTab, setActiveTab] = useState<"template" | "batch" | "manual">("template");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleDownloadPdf = async (
    invoice: InvoiceData | TaxInvoiceData,
    openInNewTab = false
  ): Promise<void> => {
    const isTaxInvoice =
      (invoice as TaxInvoiceData).docType === "invoice" || docType === "invoice";
    const defaultPrefix = isTaxInvoice ? "Tax_Invoice" : "Delivery_Challan";
    const safeInvoiceNo = (invoice.Invoice_No || defaultPrefix).replace(
      /[/\\?%*:|"<>]/g,
      "_"
    );
    const filename = `${safeInvoiceNo}.pdf`;

    try {
      const form = document.createElement("form");
      form.method = "POST";
      const actionUrl = isTaxInvoice
        ? openInNewTab
          ? "/api/generate-pdf?view=1&type=invoice"
          : "/api/generate-pdf?type=invoice"
        : openInNewTab
        ? "/api/generate-pdf?view=1"
        : "/api/generate-pdf";

      form.action = actionUrl;
      if (openInNewTab) {
        form.target = "_blank";
      }
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "payload";
      input.value = JSON.stringify(invoice);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();

      if (!openInNewTab) {
        showToast(`Downloaded "${filename}"`);
      }

      setTimeout(() => {
        try {
          document.body.removeChild(form);
        } catch {}
      }, 10000);
    } catch (error: unknown) {
      console.error("PDF download failed:", error);
      const msg = error instanceof Error ? error.message : "PDF generation failed";
      alert(`PDF Generation Error: ${msg}`);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      <Header />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top-Level Document Type Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="p-1.5 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 shadow-inner inline-flex items-center gap-1.5 self-start">
            <button
              type="button"
              onClick={() => setDocType("challan")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                docType === "challan"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>1. Delivery Challan</span>
            </button>

            <button
              type="button"
              onClick={() => setDocType("invoice")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                docType === "invoice"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>2. Bill of Supply</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wide font-extrabold">
                NEW
              </span>
            </button>
          </div>

          {/* Mode Selector Tabs (Master Template vs Standard Batch vs Manual) */}
          <div className="inline-flex p-1.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 shadow-inner self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("template")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "template"
                  ? "bg-white dark:bg-zinc-900 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>PDF Master + Excel Batch</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wide font-extrabold">
                NEW
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("batch")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "batch"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Standard Excel Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "manual"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileEdit className="w-4 h-4 text-blue-500" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Dynamic Banner Card */}
        {docType === "challan" ? (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 sm:p-8 text-white shadow-lg animate-in fade-in duration-200">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery Challan Module</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Delivery Challan Generation Engine
              </h1>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                Generate standardized Delivery Challans for <strong>M/S. Reliance Industries Limited</strong>.
                Supports Excel auto-grouping by <code className="bg-white/20 px-1 py-0.5 rounded text-xs">Invoice_No</code>,
                live document preview, in-preview editing, and single-click Puppeteer PDF generation.
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs font-medium text-blue-100">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-200" />
                <span>Issuer: ANASTOMOSIS ENTERPRISE LLP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-200" />
                <span>Print-Ready Formal Layout</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 sm:p-8 text-white shadow-lg animate-in fade-in duration-200">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase">
                <ReceiptText className="w-3.5 h-3.5" />
                <span>Bill of Supply Module</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Official Bill of Supply Generation Engine
              </h1>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Generate official Bill of Supply documents matching your company template.
                Includes auto & editable GST calculations (CGST/SGST/IGST), manual signature space,
                Reliance vendor code, bank details, and real-time editable preview.
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-100">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-200" />
                <span>GST No.: 24ABWFA7922J1ZY (Gujarat - 24)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-200" />
                <span>Editable GST Amounts & Auto Number-to-Words</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        <div className="transition-opacity duration-200">
          {activeTab === "template" ? (
            <MasterTemplateBatchView
              key={docType}
              docType={docType}
              onDownloadPdf={handleDownloadPdf}
            />
          ) : docType === "challan" ? (
            activeTab === "batch" ? (
              <BatchUploadView onDownloadPdf={handleDownloadPdf} />
            ) : (
              <ManualEntryForm onDownloadPdf={handleDownloadPdf} />
            )
          ) : activeTab === "batch" ? (
            <TaxInvoiceBatchUploadView onDownloadPdf={handleDownloadPdf} />
          ) : (
            <TaxInvoiceManualEntryForm onDownloadPdf={handleDownloadPdf} />
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl shadow-2xl border border-zinc-700 dark:border-zinc-300 text-sm font-medium animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>
          &copy; 2026 ANASTOMOSIS ENTERPRISE LLP &bull; Delivery Challan & Bill of Supply Platform
        </p>
      </footer>
    </div>
  );
}
