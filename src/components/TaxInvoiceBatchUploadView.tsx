"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Calendar,
  Truck,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Pencil,
  Building2,
  IndianRupee,
} from "lucide-react";
import { TaxInvoiceData } from "@/types/taxInvoice";
import { parseAndGroupTaxInvoiceExcel } from "@/lib/taxInvoiceExcelParser";
import {
  SAMPLE_TAX_INVOICES,
  generateSampleTaxInvoiceExcelFile,
} from "@/lib/taxInvoiceSampleData";
import TaxInvoicePreviewModal from "./TaxInvoicePreviewModal";

interface TaxInvoiceBatchUploadViewProps {
  onDownloadPdf: (invoice: TaxInvoiceData, openInNewTab?: boolean) => Promise<void>;
}

export default function TaxInvoiceBatchUploadView({
  onDownloadPdf,
}: TaxInvoiceBatchUploadViewProps) {
  const [invoices, setInvoices] = useState<TaxInvoiceData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [expandedInvoiceNos, setExpandedInvoiceNos] = useState<Record<string, boolean>>({});
  const [downloadingMap, setDownloadingMap] = useState<Record<string, boolean>>({});
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState<TaxInvoiceData | null>(null);
  const [previewModalMode, setPreviewModalMode] = useState<"preview" | "edit">("preview");
  const [searchTerm, setSearchTerm] = useState("");
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    setErrors([]);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseAndGroupTaxInvoiceExcel(buffer);

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
      }

      setInvoices(result.invoices);

      if (result.invoices.length > 0) {
        setExpandedInvoiceNos({ [result.invoices[0].Invoice_No]: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reading file";
      setErrors([msg]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleLoadSampleData = () => {
    setFileName("Sample_Tax_Invoices_Reliance.xlsx");
    setInvoices(SAMPLE_TAX_INVOICES);
    setErrors([]);
    setExpandedInvoiceNos({ [SAMPLE_TAX_INVOICES[0].Invoice_No]: true });
  };

  const handleDownloadTemplate = () => {
    const uint8 = generateSampleTaxInvoiceExcelFile();
    const blob = new Blob([uint8 as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Bill_of_Supply_Upload_Template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInvoices([]);
    setErrors([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenPreview = (invoice: TaxInvoiceData) => {
    setSelectedPreviewInvoice(invoice);
    setPreviewModalMode("preview");
  };

  const handleOpenEdit = (invoice: TaxInvoiceData) => {
    setSelectedPreviewInvoice(invoice);
    setPreviewModalMode("edit");
  };

  const handleUpdateInvoice = (
    updatedInvoice: TaxInvoiceData,
    originalInvoiceNo: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.Invoice_No === originalInvoiceNo ? updatedInvoice : inv
      )
    );

    if (originalInvoiceNo && originalInvoiceNo !== updatedInvoice.Invoice_No) {
      setExpandedInvoiceNos((prev) => {
        const next = { ...prev };
        if (next[originalInvoiceNo] !== undefined) {
          next[updatedInvoice.Invoice_No] = next[originalInvoiceNo];
          delete next[originalInvoiceNo];
        }
        return next;
      });
    }

    setSelectedPreviewInvoice(updatedInvoice);
  };

  const toggleExpand = (invoiceNo: string) => {
    setExpandedInvoiceNos((prev) => ({
      ...prev,
      [invoiceNo]: !prev[invoiceNo],
    }));
  };

  const handleDownloadSingle = async (
    invoice: TaxInvoiceData,
    openInNewTab = false
  ) => {
    const key = invoice.Invoice_No;
    setDownloadingMap((prev) => ({ ...prev, [key]: true }));
    try {
      await onDownloadPdf(invoice, openInNewTab);
    } finally {
      setDownloadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDownloadAll = async () => {
    if (invoices.length === 0 || batchDownloading) return;
    setBatchDownloading(true);
    setBatchProgress({ current: 0, total: invoices.length });

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      setBatchProgress({ current: i + 1, total: invoices.length });
      try {
        await onDownloadPdf(invoice);
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (err) {
        console.error(`Failed to download ${invoice.Invoice_No}:`, err);
      }
    }

    setBatchDownloading(false);
    setBatchProgress(null);
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.Invoice_No?.toLowerCase().includes(term) ||
      inv.Billed_To_Name?.toLowerCase().includes(term) ||
      inv.PO_No?.toLowerCase().includes(term) ||
      inv.Vehicle_No?.toLowerCase().includes(term) ||
      inv.DC_No?.toLowerCase().includes(term) ||
      inv.items.some((it) => it.Item_Description?.toLowerCase().includes(term))
    );
  });

  const totalInvoicedValue = invoices.reduce((sum, inv) => {
    const num =
      typeof inv.Total_Amount_After_Tax === "number"
        ? inv.Total_Amount_After_Tax
        : parseFloat(String(inv.Total_Amount_After_Tax || 0));
    return isNaN(num) ? sum : sum + num;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 scale-[1.01]"
            : "border-zinc-300 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700"
        } shadow-xs`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="tax-invoice-excel-input"
        />

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
            {isParsing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Upload Bill of Supply Excel Sheet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Supported formats: <span className="font-medium text-zinc-700 dark:text-zinc-300">.xlsx, .xls, .csv</span>.
            Supports rates, editable GST amounts, and auto-grouping by <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">Invoice_No</code>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse File</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors"
              title="Download pre-formatted Bill of Supply Excel template"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Excel Template</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Load Reliance Sample</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 max-w-xl">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Accepted Headers: </span>
            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              Invoice_No, Date, DC_No, PO_No, Vehicle_No, Description, HSN_Code, Qty, Unit, Rate, Taxable_Amount, GST_Rate, GST_Amount
            </span>
          </div>

          {fileName && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Loaded: {fileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Errors & Alerts */}
      {errors.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-4 h-4" />
            <span>Parsing Notes / Alerts:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {invoices.length} {invoices.length === 1 ? "Bill of Supply" : "Bills of Supply"}
              </span>

              {totalInvoicedValue > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg flex items-center gap-1">
                  <span>Total Value:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{totalInvoicedValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search invoice or buyer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 w-44 sm:w-56"
              />

              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={batchDownloading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {batchDownloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      Downloading ({batchProgress?.current}/{batchProgress?.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All ({invoices.length})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filteredInvoices.map((invoice, index) => {
              const isExpanded = !!expandedInvoiceNos[invoice.Invoice_No];
              const isDownloading = !!downloadingMap[invoice.Invoice_No];

              return (
                <div
                  key={`${invoice.Invoice_No}-${index}`}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                >
                  <div className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {invoice.Invoice_No}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {invoice.items.length} {invoice.items.length === 1 ? "Item" : "Items"}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md font-mono">
                          Total: ₹{Number(invoice.Total_Amount_After_Tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Header Fields Meta Tags */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate max-w-[140px]" title={invoice.Billed_To_Name}>
                            {invoice.Billed_To_Name || "Reliance"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Date:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">
                            {invoice.Invoice_Date || "&mdash;"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>PO:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200 font-mono">
                            {invoice.PO_No || "&mdash;"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Vehicle:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200 font-mono">
                            {invoice.Vehicle_No || "&mdash;"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                        title="Edit rates, GST amounts or line items"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(invoice, true)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        <span>Open PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(invoice, false)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(invoice.Invoice_No)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable items table */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
                      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3">Description of Goods</th>
                              <th className="py-2.5 px-3 w-24 text-center">HSN</th>
                              <th className="py-2.5 px-3 w-16 text-right">Qty</th>
                              <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                              <th className="py-2.5 px-3 w-20 text-right">Rate</th>
                              <th className="py-2.5 px-3 w-24 text-right">Taxable</th>
                              <th className="py-2.5 px-3 w-16 text-center">GST %</th>
                              <th className="py-2.5 px-3 w-20 text-right">GST Amt</th>
                              <th className="py-2.5 px-3 w-24 text-right">Total Amt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {invoice.items.map((item, itIdx) => (
                              <tr key={itIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                <td className="py-2 px-3 text-center text-zinc-400">
                                  {itIdx + 1}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {item.Item_Description}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 font-mono">
                                    {item.Tax_Subtext || (item.HSN_Code ? `GST-${item.GST_Rate ?? 0}% (HSN ${item.HSN_Code})` : `GST-${item.GST_Rate ?? 0}%`)}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-zinc-600 dark:text-zinc-400">
                                  {item.HSN_Code || "&mdash;"}
                                </td>
                                <td className="py-2 px-3 text-right font-medium">
                                  {String(item.Quantity || "")}
                                </td>
                                <td className="py-2 px-3 text-center uppercase text-zinc-500">
                                  {item.Unit}
                                </td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {item.Rate !== undefined ? Number(item.Rate).toFixed(2) : ""}
                                </td>
                                <td className="py-2 px-3 text-right font-bold">
                                  {item.Taxable_Amount !== undefined ? Number(item.Taxable_Amount).toFixed(2) : ""}
                                </td>
                                <td className="py-2 px-3 text-center text-zinc-500">
                                  {item.GST_Rate !== undefined && item.GST_Rate !== null && item.GST_Rate !== "" ? `${item.GST_Rate}%` : "0%"}
                                </td>
                                <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                  {item.GST_Amount !== undefined ? Number(item.GST_Amount).toFixed(2) : ""}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                                  {item.Total_Amount !== undefined ? Number(item.Total_Amount).toFixed(2) : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{invoice.items.length} line items listed</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(invoice)}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Rates, Quantities or GST Amounts</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preview & Edit Modal */}
      {selectedPreviewInvoice && (
        <TaxInvoicePreviewModal
          invoice={selectedPreviewInvoice}
          initialMode={previewModalMode}
          onClose={() => setSelectedPreviewInvoice(null)}
          onDownload={onDownloadPdf}
          onSave={handleUpdateInvoice}
        />
      )}
    </div>
  );
}

