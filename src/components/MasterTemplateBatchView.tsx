"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Eye,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Building2,
  Truck,
  Hash,
  Package,
  Calendar,
  Layers,
  Check,
  Search,
} from "lucide-react";
import { InvoiceData } from "@/types/invoice";
import { TaxInvoiceData } from "@/types/taxInvoice";
import { ExtractedPdfTemplate } from "@/lib/pdfParser";
import {
  FieldConfig,
  getDefaultFieldConfigs,
  generateDynamicExcelTemplate,
  mergeTemplateWithExcel,
} from "@/lib/templateExcelMerger";
import InvoicePreviewModal from "./InvoicePreviewModal";
import TaxInvoicePreviewModal from "./TaxInvoicePreviewModal";

interface MasterTemplateBatchViewProps {
  docType: "challan" | "invoice";
  onDownloadPdf: (
    invoice: InvoiceData | TaxInvoiceData,
    openInNewTab?: boolean
  ) => Promise<void>;
}

export default function MasterTemplateBatchView({
  docType,
  onDownloadPdf,
}: MasterTemplateBatchViewProps) {
  // Stepper: 1 = Upload PDF, 2 = Configure Blocks, 3 = Upload Excel, 4 = Verify & Download
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // PDF Extraction & Template State
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>(() =>
    getDefaultFieldConfigs(null, docType)
  );

  // Excel Upload & Merged Invoices State
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [isMergingExcel, setIsMergingExcel] = useState(false);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [generatedChallans, setGeneratedChallans] = useState<InvoiceData[]>([]);
  const [generatedInvoices, setGeneratedInvoices] = useState<TaxInvoiceData[]>([]);

  // Preview & Edit Modal States
  const [selectedChallan, setSelectedChallan] = useState<InvoiceData | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoiceData | null>(null);
  const [modalMode, setModalMode] = useState<"preview" | "edit">("preview");

  // Search & Batch Download States
  const [searchTerm, setSearchTerm] = useState("");
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // --- Step 1: Handle PDF Upload & Parsing ---
  const handlePdfUpload = async (file: File) => {
    setIsParsingPdf(true);
    setPdfError(null);
    setPdfFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse PDF document.");
      }

      const extracted: ExtractedPdfTemplate = data.template;
      const initialConfigs = getDefaultFieldConfigs(extracted, docType);
      setFieldConfigs(initialConfigs);
      setCurrentStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error reading PDF file";
      setPdfError(msg);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleUseStandardTemplate = () => {
    setPdfFileName("Standard_Default_Template.pdf");
    const initialConfigs = getDefaultFieldConfigs(null, docType);
    setFieldConfigs(initialConfigs);
    setCurrentStep(2);
  };

  // --- Step 2: Toggle Constant vs Excel ---
  const toggleFieldConstant = (key: string) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isConstant: !prev[key].isConstant,
      },
    }));
  };

  const handleFieldValueChange = (key: string, newVal: string) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: newVal,
      },
    }));
  };

  const handleDownloadDynamicTemplate = (includeConstants = true) => {
    const uint8 = generateDynamicExcelTemplate(fieldConfigs, docType, includeConstants);
    const blob = new Blob([uint8 as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Template_${includeConstants ? "With_Constants" : "Editable_Only"}_${docType === "challan" ? "Challan" : "Bill_of_Supply"}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Step 3: Handle Excel Upload & Merge ---
  const handleExcelUpload = async (file: File) => {
    setIsMergingExcel(true);
    setExcelErrors([]);
    setExcelFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const result = mergeTemplateWithExcel(buffer, fieldConfigs, docType);

      if (result.errors && result.errors.length > 0) {
        setExcelErrors(result.errors);
      }

      if (docType === "challan") {
        setGeneratedChallans(result.challans);
      } else {
        setGeneratedInvoices(result.taxInvoices);
      }

      setCurrentStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error merging Excel with template";
      setExcelErrors([msg]);
    } finally {
      setIsMergingExcel(false);
    }
  };

  const handleLoadSampleExcel = () => {
    const buf = generateDynamicExcelTemplate(fieldConfigs, docType);
    const result = mergeTemplateWithExcel(buf, fieldConfigs, docType);
    setExcelFileName("Sample_Dynamic_Batch.xlsx");
    if (result.errors && result.errors.length > 0) {
      setExcelErrors(result.errors);
    }
    if (docType === "challan") {
      setGeneratedChallans(result.challans);
    } else {
      setGeneratedInvoices(result.taxInvoices);
    }
    setCurrentStep(4);
  };

  // --- Step 4: Verification, Preview & In-place Edit ---
  const handleOpenPreview = (item: InvoiceData | TaxInvoiceData) => {
    if (docType === "challan") {
      setSelectedChallan(item as InvoiceData);
    } else {
      setSelectedInvoice(item as TaxInvoiceData);
    }
    setModalMode("preview");
  };

  const handleOpenEdit = (item: InvoiceData | TaxInvoiceData) => {
    if (docType === "challan") {
      setSelectedChallan(item as InvoiceData);
    } else {
      setSelectedInvoice(item as TaxInvoiceData);
    }
    setModalMode("edit");
  };

  const handleSaveEditedChallan = (updated: InvoiceData, origNo: string) => {
    setGeneratedChallans((prev) =>
      prev.map((c) => (c.Invoice_No === origNo ? updated : c))
    );
    setSelectedChallan(updated);
  };

  const handleSaveEditedInvoice = (updated: TaxInvoiceData, origNo: string) => {
    setGeneratedInvoices((prev) =>
      prev.map((inv) => (inv.Invoice_No === origNo ? updated : inv))
    );
    setSelectedInvoice(updated);
  };

  // Batch Sequential Downloader
  const handleDownloadAll = async () => {
    const items = docType === "challan" ? generatedChallans : generatedInvoices;
    if (items.length === 0) return;

    setBatchDownloading(true);
    setBatchProgress({ current: 0, total: items.length });

    for (let i = 0; i < items.length; i++) {
      try {
        setBatchProgress({ current: i + 1, total: items.length });
        await onDownloadPdf(items[i], false);
        // Small delay to prevent browser download throttling
        await new Promise((res) => setTimeout(res, 600));
      } catch (err) {
        console.error(`Error downloading item ${i}:`, err);
      }
    }

    setBatchDownloading(false);
    setBatchProgress(null);
  };

  // Filtering for verification list
  const activeItems = docType === "challan" ? generatedChallans : generatedInvoices;
  const filteredItems = activeItems.filter((item) => {
    const term = searchTerm.toLowerCase();
    const invNo = (item.Invoice_No || "").toLowerCase();
    const vehNo = (item.Vehicle_No || "").toLowerCase();
    const date = (item.Invoice_Date || "").toLowerCase();
    return invNo.includes(term) || vehNo.includes(term) || date.includes(term);
  });

  const totalQuantitySum = activeItems.reduce((acc, curr) => {
    const firstItem = curr.items && curr.items[0];
    const rawQty = firstItem ? String(firstItem.Quantity || 0) : "0";
    const num = parseFloat(rawQty.replace(/,/g, ""));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  // Group config fields by category for clean UI rendering
  const receiverFields = Object.values(fieldConfigs).filter((c) => c.category === "receiver");
  const headerFields = Object.values(fieldConfigs).filter((c) => c.category === "header");
  const transportFields = Object.values(fieldConfigs).filter((c) => c.category === "transport");
  const itemFields = Object.values(fieldConfigs).filter(
    (c) => c.category === "item" || c.category === "tax"
  );
  const dynamicCols = Object.values(fieldConfigs).filter((c) => !c.isConstant);

  return (
    <div className="space-y-6">
      {/* Stepper Navigation */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: 1, title: "1. Upload Master PDF", desc: "Extract template blocks" },
            { step: 2, title: "2. Lock Blocks", desc: "Tick constant vs editable" },
            { step: 3, title: "3. Upload Excel", desc: "Data to inject" },
            { step: 4, title: "4. Verify & Download", desc: "Preview & batch export" },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                disabled={currentStep < s.step && s.step > 2}
                onClick={() => {
                  if (currentStep >= s.step || (s.step === 2 && pdfFileName)) {
                    setCurrentStep(s.step as 1 | 2 | 3 | 4);
                  }
                }}
                className={`text-left p-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20"
                    : isCompleted
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 cursor-pointer"
                    : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-300 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                  </span>
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive
                        ? "text-blue-900 dark:text-blue-200"
                        : isCompleted
                        ? "text-emerald-900 dark:text-emerald-300"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 pl-8 truncate">
                  {s.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= STEP 1: UPLOAD MASTER PDF ================= */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1 of 4</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Upload Master {docType === "challan" ? "Delivery Challan" : "Bill of Supply"} PDF
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Upload a reference PDF. The system will read all fields (Receiver address, GST, PAN, PO NO,
              items). You can then tick what stays constant for 50–100 invoices.
            </p>
          </div>

          {pdfError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pdfError}</span>
            </div>
          )}

          {/* PDF Dropzone */}
          <div
            onClick={() => pdfInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 group"
          >
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePdfUpload(e.target.files[0]);
                }
              }}
            />

            {isParsingPdf ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Reading PDF & Extracting Blocks...
                </div>
                <div className="text-xs text-zinc-500">Scanning address, GST, PAN, PO, and items</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                    Click to browse or drop your Master PDF here
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Accepts standard .pdf documents
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Don&apos;t have a PDF ready?
            </span>
            <button
              type="button"
              onClick={handleUseStandardTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Use Standard Default Template</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: CONFIGURE CONSTANT VS EDITABLE BLOCKS ================= */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Step 2 of 4</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Configure Constant vs. Editable Blocks
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Tick <strong className="text-emerald-600 dark:text-emerald-400">CONSTANT</strong> for fields that remain constant across all 50–100 invoices.
                Tick <strong className="text-blue-600 dark:text-blue-400">FROM EXCEL</strong> for fields that change per row (e.g. Vehicle Number, Quantity).
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
              >
                <span>Proceed to Excel Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Tip:</strong> You can edit any address or GST text below once right now. The edited text will be locked as constant for all subsequent challans!
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadDynamicTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs hover:bg-amber-100 dark:hover:bg-zinc-700 shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Block Categories */}
          <div className="space-y-6">
            {/* Category 1: Receiver & Address Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Receiver & Destination Addresses</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {receiverFields.map((field) => (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      field.isConstant
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800"
                        : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/80 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {field.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFieldConstant(field.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          field.isConstant
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {field.isConstant ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>CONSTANT</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>FROM EXCEL</span>
                          </>
                        )}
                      </button>
                    </div>
                    {field.key.includes("Address") ? (
                      <textarea
                        rows={2}
                        value={field.value}
                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                        className="w-full text-xs font-mono p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Category 2: Transport & Vehicle */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Transport & Vehicle</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {transportFields.map((field) => (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      field.isConstant
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800"
                        : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/80 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {field.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFieldConstant(field.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          field.isConstant
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {field.isConstant ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>CONSTANT</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>FROM EXCEL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Category 3: Item, Quantity & Rates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <Package className="w-4 h-4 text-emerald-500" />
                <span>Goods Description, Quantity & Rates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {itemFields.map((field) => (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      field.isConstant
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800"
                        : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/80 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {field.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFieldConstant(field.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          field.isConstant
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {field.isConstant ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>CONSTANT</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>FROM EXCEL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Category 4: Header Numbers & Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <Hash className="w-4 h-4 text-purple-500" />
                <span>Document References & Dates</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {headerFields.map((field) => (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      field.isConstant
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800"
                        : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/80 dark:border-blue-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {field.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFieldConstant(field.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
                          field.isConstant
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {field.isConstant ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>CONSTANT</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>FROM EXCEL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Required Columns Preview & Bottom Actions */}
          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Excel Required Columns ({dynamicCols.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {dynamicCols.map((col) => (
                    <span
                      key={col.key}
                      className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-mono font-semibold"
                    >
                      {col.key}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadDynamicTemplate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
                >
                  <span>Upload Excel Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: UPLOAD EXCEL DATA ================= */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Step 3 of 4</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Upload Your Excel Data Sheet
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Upload the Excel sheet with your 50–100 rows containing dynamic values (e.g. Vehicle Number, Quantity, Date).
                The locked constant values will automatically be applied to every single row!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Block Settings</span>
            </button>
          </div>

          {/* Active Constant Template Summary Card */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Locked Destination for This Entire Batch:</span>
            </div>
            <div>
              <strong>Party:</strong> {fieldConfigs.Buyer_Name?.value || "N/A"} | <strong>GST:</strong>{" "}
              {fieldConfigs.Buyer_GSTIN?.value || "N/A"} | <strong>PO:</strong>{" "}
              {fieldConfigs.PO_No?.value || "N/A"}
            </div>
            <div className="text-zinc-500 dark:text-zinc-400 truncate">
              <strong>Address:</strong> {fieldConfigs.Buyer_Address?.value || "N/A"}
            </div>
          </div>

          {excelErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Errors processing Excel file:</span>
              </div>
              <ul className="list-disc pl-5 text-xs">
                {excelErrors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Excel Dropzone */}
          <div
            onClick={() => excelInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 group"
          >
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleExcelUpload(e.target.files[0]);
                }
              }}
            />

            {isMergingExcel ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Merging Template with Excel Rows...
                </div>
                <div className="text-xs text-zinc-500">Injecting constant address, calculating taxes</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
                    Click to browse or drop your Excel sheet here
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Accepts .xlsx, .xls, .csv files
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Need sample data or template?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadDynamicTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>Download Blank Template</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Excel Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: VERIFY, EDIT & DOWNLOAD ================= */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Top Control Header */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Batch Verification Stage</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{activeItems.length} {docType === "challan" ? "Challans" : "Bills of Supply"} Ready</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-normal">
                  Total Qty: {totalQuantitySum.toFixed(3)} TON
                </span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Adjust Master Template</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Different Excel</span>
              </button>

              <button
                type="button"
                disabled={batchDownloading || activeItems.length === 0}
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
              >
                {batchDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      Downloading ({batchProgress?.current}/{batchProgress?.total})...
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download All ({activeItems.length}) PDFs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by invoice number, vehicle number, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cards / Table List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => {
              const firstItem = item.items && item.items[0];
              const qtyDisplay = firstItem ? `${firstItem.Quantity} ${firstItem.Unit || "TON"}` : "0.000 TON";
              const receiverName =
                (item as InvoiceData).Buyer_Name || (item as TaxInvoiceData).Billed_To_Name || "Reliance";

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
                        {item.Invoice_No}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.Invoice_Date}</span>
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Vehicle Number:</div>
                      <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>{item.Vehicle_No || "Not Specified"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-zinc-400">Qty: </span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{qtyDisplay}</span>
                      </div>
                      <div className="truncate max-w-[140px] text-zinc-500" title={receiverName}>
                        {receiverName}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this document */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                      title="Preview PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition-colors"
                      title="Edit for last minute changes"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadPdf(item, false)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Challan Preview / Edit Modal */}
      {selectedChallan && (
        <InvoicePreviewModal
          isOpen={!!selectedChallan}
          mode={modalMode}
          invoice={selectedChallan}
          onClose={() => setSelectedChallan(null)}
          onSave={handleSaveEditedChallan}
          onDownloadPdf={(inv, openInNewTab) => onDownloadPdf(inv, openInNewTab)}
        />
      )}

      {/* Tax Invoice Preview / Edit Modal */}
      {selectedInvoice && (
        <TaxInvoicePreviewModal
          isOpen={!!selectedInvoice}
          mode={modalMode}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSave={handleSaveEditedInvoice}
          onDownloadPdf={(inv, openInNewTab) => onDownloadPdf(inv, openInNewTab)}
        />
      )}
    </div>
  );
}
