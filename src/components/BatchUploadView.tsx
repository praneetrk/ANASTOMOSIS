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
} from "lucide-react";
import { InvoiceData } from "@/types/invoice";
import { parseAndGroupExcel } from "@/lib/excelParser";
import { SAMPLE_INVOICES, generateSampleExcelFile } from "@/lib/sampleData";
import { formatDateIndian } from "@/lib/dateUtils";
import InvoicePreviewModal from "./InvoicePreviewModal";

interface BatchUploadViewProps {
  onDownloadPdf: (invoice: InvoiceData, openInNewTab?: boolean) => Promise<void>;
}

export default function BatchUploadView({ onDownloadPdf }: BatchUploadViewProps) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [expandedInvoiceNos, setExpandedInvoiceNos] = useState<Record<string, boolean>>({});
  const [downloadingMap, setDownloadingMap] = useState<Record<string, boolean>>({});
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState<InvoiceData | null>(null);
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
      const result = parseAndGroupExcel(buffer);

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors);
      }

      setInvoices(result.invoices);

      // Auto-expand the first invoice for convenient inspection
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
    setFileName("Sample_Delivery_Challan_Data.xlsx");
    setInvoices(SAMPLE_INVOICES);
    setErrors([]);
    setExpandedInvoiceNos({ [SAMPLE_INVOICES[0].Invoice_No]: true });
  };

  const handleDownloadTemplate = () => {
    const uint8 = generateSampleExcelFile();
    const blob = new Blob([uint8 as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Invoice_Upload_Template.xlsx";
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

  const handleOpenPreview = (invoice: InvoiceData) => {
    setSelectedPreviewInvoice(invoice);
    setPreviewModalMode("preview");
  };

  const handleOpenEdit = (invoice: InvoiceData) => {
    setSelectedPreviewInvoice(invoice);
    setPreviewModalMode("edit");
  };

  const handleUpdateInvoice = (
    updatedInvoice: InvoiceData,
    originalInvoiceNo: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.Invoice_No === originalInvoiceNo ? updatedInvoice : inv
      )
    );

    // Keep expanded state aligned if the invoice number was renamed
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

  const handleDownloadSingle = async (invoice: InvoiceData, openInNewTab = false) => {
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
        // Small delay between downloads so the browser can queue downloads cleanly
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
      inv.PO_No?.toLowerCase().includes(term) ||
      inv.Vehicle_No?.toLowerCase().includes(term) ||
      inv.DC_No?.toLowerCase().includes(term) ||
      inv.items.some((it) => it.Item_Description?.toLowerCase().includes(term))
    );
  });

  const totalItemsCount = invoices.reduce((sum, inv) => sum + inv.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 scale-[1.01]"
            : "border-zinc-300 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-700"
        } shadow-xs`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
          id="excel-file-input"
        />

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 ring-8 ring-blue-50/50 dark:ring-blue-950/20">
            {isParsing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Drag & drop your Excel or CSV sheet here
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
            Supported formats: <span className="font-medium text-zinc-700 dark:text-zinc-300">.xlsx, .xls, .csv</span>.
            Rows will automatically group by <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono">Invoice_No</code>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse File</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-4 h-4 text-blue-500" />
              <span>Download Excel Template</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Load Sample Data</span>
            </button>
          </div>

          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 max-w-xl">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Accepted Headers: </span>
            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              Invoice_No, Date, DC_No, PO_No, Vehicle_No, Buyer_Name, Buyer_Address, Shipped_To_Name, Shipped_To_Address, Buyer_GSTIN, Buyer_PAN, Description, HSN_Code, Quantity, Unit
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

      {/* Errors & Warnings Banner */}
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

      {/* Review Section */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          {/* Action & Stats Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Parsed Invoices:
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full">
                  {invoices.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Total Items:
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
                  {totalItemsCount}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search invoice, PO, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={batchDownloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                title="Generate and download PDF for all parsed invoices"
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
                title="Clear current data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Grouped Invoices List */}
          <div className="space-y-3">
            {filteredInvoices.map((invoice, index) => {
              const isExpanded = !!expandedInvoiceNos[invoice.Invoice_No];
              const isDownloading = !!downloadingMap[invoice.Invoice_No];
              
              // Calculate sum of quantities for this invoice
              const totalQty = invoice.items.reduce((sum, item) => {
                const q = typeof item.Quantity === "number" ? item.Quantity : parseFloat(String(item.Quantity || 0));
                return isNaN(q) ? sum : sum + q;
              }, 0);

              return (
                <div
                  key={`${invoice.Invoice_No}-${index}`}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition-all"
                >
                  {/* Card Header Row */}
                  <div className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                          {invoice.Invoice_No || <span className="italic text-zinc-400">Empty Invoice No</span>}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800">
                          {invoice.items.length} {invoice.items.length === 1 ? "Item" : "Items"}
                        </span>
                        {totalQty > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md">
                            Total Qty: {Number.isInteger(totalQty) ? totalQty : totalQty.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Header Fields Meta Tags */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate max-w-[140px]" title={invoice.Buyer_Name}>
                            {invoice.Buyer_Name || "Reliance"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Date:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">
                            {formatDateIndian(invoice.Invoice_Date) || <span className="italic text-zinc-400">&mdash;</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          <span>DC No:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200">
                            {invoice.DC_No || <span className="italic text-zinc-400">&mdash;</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>PO:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200 font-mono">
                            {invoice.PO_No || <span className="italic text-zinc-400">&mdash;</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Vehicle:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-200 font-mono">
                            {invoice.Vehicle_No || <span className="italic text-zinc-400">&mdash;</span>}
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
                        title="Preview Delivery Challan HTML"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(invoice)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                        title="Edit details, items, or descriptions for this challan"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(invoice, true)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                        title="Open compiled PDF directly in a new browser tab"
                      >
                        <span>Open PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(invoice, false)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                        title={`Download ${invoice.Invoice_No}.pdf`}
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
                        title={isExpanded ? "Collapse item details" : "Expand item details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Items Details Table */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
                      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                              <th className="py-2.5 px-3 w-12 text-center">#</th>
                              <th className="py-2.5 px-3">Item Description</th>
                              <th className="py-2.5 px-3 w-28 text-center">HSN Code</th>
                              <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                              <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {invoice.items.map((item, itIdx) => (
                              <tr key={itIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                <td className="py-2 px-3 text-center text-zinc-400">
                                  {itIdx + 1}
                                </td>
                                <td className="py-2 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                                  {item.Item_Description || (
                                    <span className="italic text-zinc-400">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center font-mono text-zinc-600 dark:text-zinc-400">
                                  {item.HSN_Code || (
                                    <span className="italic text-zinc-400">&mdash;</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-zinc-800 dark:text-zinc-200">
                                  {item.Quantity !== undefined && item.Quantity !== null && item.Quantity !== ""
                                    ? String(item.Quantity)
                                    : <span className="italic text-zinc-400">&mdash;</span>}
                                </td>
                                <td className="py-2 px-3 text-center text-zinc-600 dark:text-zinc-400">
                                  {item.Unit || (
                                    <span className="italic text-zinc-400">&mdash;</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{invoice.items.length} {invoice.items.length === 1 ? "item" : "items"} listed</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(invoice)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Items & Challan Data</span>
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
        <InvoicePreviewModal
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
