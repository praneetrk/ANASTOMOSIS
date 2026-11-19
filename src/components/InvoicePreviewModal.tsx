"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Loader2,
  ExternalLink,
  Pencil,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Save,
  FileText,
  Calendar,
  Truck,
  Hash,
  PackageCheck,
  Building2,
  MapPin,
} from "lucide-react";
import { InvoiceData, InvoiceItem } from "@/types/invoice";
import { generateDeliveryChallanHtml } from "@/lib/pdfTemplate";
import { formatDateIndian } from "@/lib/dateUtils";

interface InvoicePreviewModalProps {
  invoice: InvoiceData | null;
  initialMode?: "preview" | "edit";
  onClose: () => void;
  onDownload: (invoice: InvoiceData, openInNewTab?: boolean) => Promise<void>;
  onSave?: (updatedInvoice: InvoiceData, originalInvoiceNo: string) => void;
}

const COMMON_UNITS = [
  "NOS",
  "SET",
  "PCS",
  "MTR",
  "KGS",
  "TON",
  "LTR",
  "BOX",
  "PKT",
  "ROLL",
  "PAIR",
  "DRUM",
  "BAG",
];

export default function InvoicePreviewModal({
  invoice,
  initialMode = "preview",
  onClose,
  onDownload,
  onSave,
}: InvoicePreviewModalProps) {
  const [mode, setMode] = useState<"preview" | "edit">(initialMode);
  const [downloading, setDownloading] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Keep a local working copy of the invoice for live editing
  const [editData, setEditData] = useState<InvoiceData>({
    Invoice_No: "",
    Invoice_Date: "",
    DC_No: "",
    DC_Date: "",
    PO_No: "",
    Vehicle_No: "",
    Location: "NAVSARI CBG",
    items: [],
  });

  const [originalInvoiceNo, setOriginalInvoiceNo] = useState<string>("");

  useEffect(() => {
    if (invoice) {
      setEditData({
        Invoice_No: invoice.Invoice_No || "",
        Invoice_Date: formatDateIndian(invoice.Invoice_Date || ""),
        DC_No: invoice.DC_No || "",
        DC_Date: formatDateIndian(invoice.DC_Date || invoice.Invoice_Date || ""),
        PO_No: invoice.PO_No || "241128591",
        Vehicle_No: invoice.Vehicle_No || "RJ09GE7594",
        Location: invoice.Location || "NAVSARI CBG",
        Buyer_Name: invoice.Buyer_Name || "M/S. Reliance Industries Limited",
        Buyer_Address:
          invoice.Buyer_Address ||
          "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
        Shipped_To_Name:
          invoice.Shipped_To_Name || invoice.Buyer_Name || "M/S. Reliance Industries Limited",
        Shipped_To_Address:
          invoice.Shipped_To_Address ||
          invoice.Buyer_Address ||
          "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
        Buyer_GSTIN: invoice.Buyer_GSTIN || "24AAACR5055K1ZD",
        Buyer_PAN: invoice.Buyer_PAN || "AAACR5055K",
        Vendor_Code: invoice.Vendor_Code || "3778226",
        items:
          Array.isArray(invoice.items) && invoice.items.length > 0
            ? invoice.items.map((it) => ({ ...it }))
            : [{ Item_Description: "", HSN_Code: "", Quantity: "", Unit: "TON" }],
      });
      setOriginalInvoiceNo(invoice.Invoice_No || "");
      setMode(initialMode);
      setSavedFeedback(null);
      setValidationError(null);
    }
  }, [invoice, initialMode]);

  if (!invoice) return null;

  // Real-time HTML generation using whatever is currently in editData
  const htmlContent = generateDeliveryChallanHtml(editData);

  const handleHeaderChange = (field: keyof InvoiceData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationError) setValidationError(null);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) => {
    setEditData((prev) => {
      const nextItems = [...prev.items];
      const current = {
        ...nextItems[index],
        [field]: value,
      };
      const hsn = (current.HSN_Code || "").trim();
      current.Tax_Subtext = hsn ? `GST-0% (HSN ${hsn})` : "GST-0%";
      nextItems[index] = current;
      return { ...prev, items: nextItems };
    });
  };

  const handleAddItem = () => {
    setEditData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { Item_Description: "", HSN_Code: "", Quantity: "", Unit: "NOS" },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setEditData((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [{ Item_Description: "", HSN_Code: "", Quantity: "", Unit: "NOS" }],
        };
      }
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  };

  const handleResetToOriginal = () => {
    if (!invoice) return;
    setEditData({
      Invoice_No: invoice.Invoice_No || "",
      Invoice_Date: invoice.Invoice_Date || "",
      DC_No: invoice.DC_No || "",
      DC_Date: invoice.DC_Date || "",
      PO_No: invoice.PO_No || "",
      Vehicle_No: invoice.Vehicle_No || "",
      Location: invoice.Location || "NAVSARI CBG",
      Buyer_Name: invoice.Buyer_Name || "M/S. Reliance Industries Limited",
      Buyer_Address:
        invoice.Buyer_Address ||
        "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Shipped_To_Name:
        invoice.Shipped_To_Name || invoice.Buyer_Name || "M/S. Reliance Industries Limited",
      Shipped_To_Address:
        invoice.Shipped_To_Address ||
        invoice.Buyer_Address ||
        "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Buyer_GSTIN: invoice.Buyer_GSTIN || "24AAACR5055K1ZD",
      Buyer_PAN: invoice.Buyer_PAN || "AAACR5055K",
      Vendor_Code: invoice.Vendor_Code || "3778226",
      items:
        Array.isArray(invoice.items) && invoice.items.length > 0
          ? invoice.items.map((it) => ({ ...it }))
          : [{ Item_Description: "", HSN_Code: "", Quantity: "", Unit: "NOS" }],
    });
    setValidationError(null);
    setSavedFeedback("Reset to uploaded sheet values.");
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleSave = (switchModeToPreview = true): boolean => {
    if (!editData.Invoice_No.trim()) {
      setValidationError("Invoice Number cannot be empty.");
      return false;
    }

    const cleanedData: InvoiceData = {
      Invoice_No: editData.Invoice_No.trim(),
      Invoice_Date: formatDateIndian(editData.Invoice_Date?.trim() || ""),
      DC_No: editData.DC_No?.trim() || "",
      DC_Date: formatDateIndian(editData.DC_Date?.trim() || editData.Invoice_Date?.trim() || ""),
      PO_No: editData.PO_No?.trim() || "",
      Vehicle_No: editData.Vehicle_No?.trim() || "",
      Location: editData.Location?.trim() || "NAVSARI CBG",
      Buyer_Name: editData.Buyer_Name?.trim() || "M/S. Reliance Industries Limited",
      Buyer_Address:
        editData.Buyer_Address?.trim() ||
        "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Shipped_To_Name:
        editData.Shipped_To_Name?.trim() ||
        editData.Buyer_Name?.trim() ||
        "M/S. Reliance Industries Limited",
      Shipped_To_Address:
        editData.Shipped_To_Address?.trim() ||
        editData.Buyer_Address?.trim() ||
        "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
      Buyer_GSTIN: editData.Buyer_GSTIN?.trim() || "24AAACR5055K1ZD",
      Buyer_PAN: editData.Buyer_PAN?.trim() || "AAACR5055K",
      Vendor_Code: editData.Vendor_Code?.trim() || "3778226",
      items: editData.items.map((it) => {
        const hsn = (it.HSN_Code || "").trim();
        return {
          Item_Description: (it.Item_Description || "").trim(),
          HSN_Code: hsn,
          Quantity:
            it.Quantity !== undefined && it.Quantity !== null
              ? String(it.Quantity).trim()
              : "",
          Unit: (it.Unit || "").trim(),
          Tax_Subtext: hsn ? `GST-0% (HSN ${hsn})` : "GST-0%",
        };
      }),
    };

    if (onSave) {
      onSave(cleanedData, originalInvoiceNo);
    }

    setOriginalInvoiceNo(cleanedData.Invoice_No);
    setEditData(cleanedData);
    setValidationError(null);
    setSavedFeedback("Changes saved successfully! Batch list & preview updated.");
    setTimeout(() => setSavedFeedback(null), 4000);

    if (switchModeToPreview) {
      setMode("preview");
    }
    return true;
  };

  const handleDownload = async (openInNewTab = false) => {
    try {
      setDownloading(true);
      // Auto-save any pending changes before generating PDF
      if (onSave) {
        handleSave(false);
      }
      await onDownload(editData, openInNewTab);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };

  // Total quantity calculation for items summary
  const totalQuantity = editData.items.reduce((sum, it) => {
    const val = parseFloat(String(it.Quantity || 0).replace(/,/g, ""));
    return isNaN(val) ? sum : sum + val;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <datalist id="common-units-list">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                  {mode === "edit" ? "Edit Delivery Challan" : "Challan Preview"}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                  {editData.Invoice_No || "Untitled"}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {mode === "edit"
                  ? "Modify invoice details or line items directly below"
                  : "Live print-ready Delivery Challan layout"}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === "preview"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === "edit"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-2">
            {mode === "preview" ? (
              <>
                <button
                  onClick={() => setMode("edit")}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                  title="Edit Challan Details & Items"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <button
                  onClick={handleOpenNewTab}
                  type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  title="Open full preview in a new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>

                <button
                  onClick={() => handleDownload(true)}
                  disabled={downloading}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  title="Open compiled PDF directly in a new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </button>

                <button
                  onClick={() => handleDownload(false)}
                  disabled={downloading}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleResetToOriginal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  title="Reset to uploaded spreadsheet values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Preview</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / Alert Banners */}
        {savedFeedback && (
          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{savedFeedback}</span>
            </div>
          </div>
        )}

        {validationError && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-6">
          {mode === "preview" ? (
            /* Document Live Iframe Preview */
            <div className="flex justify-center">
              <div className="w-full max-w-[210mm] bg-white shadow-lg rounded-sm overflow-hidden min-h-[550px]">
                <iframe
                  srcDoc={htmlContent}
                  title="Challan Document Preview"
                  className="w-full h-[700px] border-none"
                />
              </div>
            </div>
          ) : (
            /* Edit Form Interface */
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Card 1: Header / Dispatch Details */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Header & Dispatch Details</span>
                  </h4>
                  <span className="text-xs text-zinc-400">
                    M/S. Reliance Industries Limited
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-zinc-400" />
                      <span>Invoice No *</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Invoice_No}
                      onChange={(e) => handleHeaderChange("Invoice_No", e.target.value)}
                      placeholder="e.g. INV-2026-0891"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>Invoice Date</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Invoice_Date || ""}
                      onChange={(e) => handleHeaderChange("Invoice_Date", e.target.value)}
                      placeholder="DD/MM/YYYY (e.g. 27/10/2026)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-zinc-400" />
                      <span>DC No (Delivery Challan)</span>
                    </label>
                    <input
                      type="text"
                      value={editData.DC_No || ""}
                      onChange={(e) => handleHeaderChange("DC_No", e.target.value)}
                      placeholder="e.g. DC-2026-4401"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>DC Date</span>
                    </label>
                    <input
                      type="text"
                      value={editData.DC_Date || ""}
                      onChange={(e) => handleHeaderChange("DC_Date", e.target.value)}
                      placeholder="DD/MM/YYYY (e.g. 27/10/2026)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <PackageCheck className="w-3 h-3 text-zinc-400" />
                      <span>PO No (Purchase Order)</span>
                    </label>
                    <input
                      type="text"
                      value={editData.PO_No || ""}
                      onChange={(e) => handleHeaderChange("PO_No", e.target.value)}
                      placeholder="e.g. RIL-PO-982104"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-zinc-400" />
                      <span>Vehicle / Transport No</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Vehicle_No || ""}
                      onChange={(e) => handleHeaderChange("Vehicle_No", e.target.value)}
                      placeholder="e.g. RJ09GE7594"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Location / Unit
                    </label>
                    <input
                      type="text"
                      value={editData.Location || ""}
                      onChange={(e) => handleHeaderChange("Location", e.target.value)}
                      placeholder="e.g. NAVSARI CBG"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Receiver & Shipping Details (Billed To & Shipped To & Tax) */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Receiver & Delivery Details</span>
                  </h4>
                  <span className="text-xs text-zinc-400 font-mono">
                    GST & Shipping Destination
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Billed To */}
                  <div className="space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Details of Receiver (Billed To)</span>
                    </span>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Buyer Name
                      </label>
                      <input
                        type="text"
                        value={editData.Buyer_Name || ""}
                        onChange={(e) => handleHeaderChange("Buyer_Name", e.target.value)}
                        placeholder="M/S. Reliance Industries Limited"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Buyer Address
                      </label>
                      <textarea
                        rows={3}
                        value={editData.Buyer_Address || ""}
                        onChange={(e) => handleHeaderChange("Buyer_Address", e.target.value)}
                        placeholder="Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Shipped To */}
                  <div className="space-y-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Shipped To (Consignee)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleHeaderChange("Shipped_To_Name", editData.Buyer_Name || "");
                          handleHeaderChange("Shipped_To_Address", editData.Buyer_Address || "");
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                      >
                        Copy Billed To
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Shipped To Name
                      </label>
                      <input
                        type="text"
                        value={editData.Shipped_To_Name || ""}
                        onChange={(e) => handleHeaderChange("Shipped_To_Name", e.target.value)}
                        placeholder="M/S. Reliance Industries Limited"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Shipped To Address
                      </label>
                      <textarea
                        rows={3}
                        value={editData.Shipped_To_Address || ""}
                        onChange={(e) => handleHeaderChange("Shipped_To_Address", e.target.value)}
                        placeholder="Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax & Vendor Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Receiver GST NO.
                    </label>
                    <input
                      type="text"
                      value={editData.Buyer_GSTIN || ""}
                      onChange={(e) => handleHeaderChange("Buyer_GSTIN", e.target.value.toUpperCase())}
                      placeholder="24AAACR5055K1ZD"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Receiver PAN NO.
                    </label>
                    <input
                      type="text"
                      value={editData.Buyer_PAN || ""}
                      onChange={(e) => handleHeaderChange("Buyer_PAN", e.target.value.toUpperCase())}
                      placeholder="AAACR5055K"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Reliance Vendor Code
                    </label>
                    <input
                      type="text"
                      value={editData.Vendor_Code || ""}
                      onChange={(e) => handleHeaderChange("Vendor_Code", e.target.value)}
                      placeholder="3778226"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Line Items / Materials */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Line Items ({editData.items.length})
                    </h4>
                    {totalQuantity > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        Total Qty: {Number.isInteger(totalQuantity) ? totalQuantity : totalQuantity.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {editData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                          #{idx + 1}
                        </span>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Description */}
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Item Description / Particulars
                            </label>
                            <textarea
                              rows={2}
                              value={item.Item_Description || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "Item_Description", e.target.value)
                              }
                              placeholder="Detailed description of material / goods..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-y"
                            />
                          </div>

                          {/* HSN Code */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              HSN Code
                            </label>
                            <input
                              type="text"
                              value={item.HSN_Code || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "HSN_Code", e.target.value)
                              }
                              placeholder="e.g. 7307"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-center"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={
                                item.Quantity !== undefined && item.Quantity !== null
                                  ? String(item.Quantity)
                                  : ""
                              }
                              onChange={(e) =>
                                handleItemChange(idx, "Quantity", e.target.value)
                              }
                              placeholder="e.g. 24"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-right font-medium"
                            />
                          </div>

                          {/* Unit */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              list="common-units-list"
                              value={item.Unit || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "Unit", e.target.value)
                              }
                              placeholder="NOS"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center uppercase"
                            />
                          </div>
                        </div>

                        {/* Remove Row Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors mt-5"
                          title="Remove this item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Another Item Row</span>
                  </button>
                </div>
              </div>

              {/* Bottom Action Footer for Edit Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Tip: Saving automatically updates the live preview and batch export list.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className="px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
                  >
                    Cancel & Return to Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
