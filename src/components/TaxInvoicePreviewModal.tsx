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
  Percent,
} from "lucide-react";
import { TaxInvoiceData, TaxInvoiceItem } from "@/types/taxInvoice";
import { generateTaxInvoiceHtml } from "@/lib/taxInvoicePdfTemplate";
import { formatDateIndian } from "@/lib/dateUtils";
import { numberToWordsIndian } from "@/lib/numberToWords";

interface TaxInvoicePreviewModalProps {
  invoice: TaxInvoiceData | null;
  initialMode?: "preview" | "edit";
  onClose: () => void;
  onDownload: (invoice: TaxInvoiceData, openInNewTab?: boolean) => Promise<void>;
  onSave?: (updatedInvoice: TaxInvoiceData, originalInvoiceNo: string) => void;
}

const COMMON_UNITS = ["TON", "NOS", "SET", "PCS", "MTR", "KGS", "LTR", "BOX", "PKT"];

export default function TaxInvoicePreviewModal({
  invoice,
  initialMode = "preview",
  onClose,
  onDownload,
  onSave,
}: TaxInvoicePreviewModalProps) {
  const [mode, setMode] = useState<"preview" | "edit">(initialMode);
  const [downloading, setDownloading] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [editData, setEditData] = useState<TaxInvoiceData>({
    docType: "invoice",
    Invoice_No: "",
    Invoice_Date: "",
    DC_No: "",
    DC_Date: "",
    PO_No: "",
    Vehicle_No: "",
    Billed_To_Name: "",
    Billed_To_Address: "",
    Billed_To_State: "Gujarat, India",
    Billed_To_State_Code: "24",
    Shipped_To_Name: "",
    Shipped_To_Address: "",
    Shipped_To_State: "Gujarat, India",
    Shipped_To_State_Code: "24",
    Buyer_GSTIN: "",
    Buyer_PAN: "",
    Vendor_Code: "",
    Place_Of_Supply: "GUJARAT",
    CGST_Rate: "2.5%",
    CGST_Amount: "",
    SGST_Rate: "2.5%",
    SGST_Amount: "",
    Round_Off: 0.0,
    items: [],
  });

  const [originalInvoiceNo, setOriginalInvoiceNo] = useState<string>("");

  useEffect(() => {
    if (invoice) {
      setEditData({
        ...invoice,
        docType: "invoice",
        Invoice_Date: formatDateIndian(invoice.Invoice_Date || ""),
        DC_Date: formatDateIndian(invoice.DC_Date || invoice.Invoice_Date || ""),
        Shipped_To_Name: invoice.Shipped_To_Name || invoice.Billed_To_Name || "Reliance New Solar Energy Limited",
        Shipped_To_Address:
          invoice.Shipped_To_Address ||
          invoice.Billed_To_Address ||
          "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
        Shipped_To_State: invoice.Shipped_To_State || invoice.Billed_To_State || "Gujarat, India",
        Shipped_To_State_Code: invoice.Shipped_To_State_Code || invoice.Billed_To_State_Code || "24",
        CGST_Rate: invoice.CGST_Rate || "2.5%",
        CGST_Amount: invoice.CGST_Amount !== undefined ? invoice.CGST_Amount : "",
        SGST_Rate: invoice.SGST_Rate || "2.5%",
        SGST_Amount: invoice.SGST_Amount !== undefined ? invoice.SGST_Amount : "",
        items:
          Array.isArray(invoice.items) && invoice.items.length > 0
            ? invoice.items.map((it) => ({ ...it }))
            : [
                {
                  Sr: 1,
                  Item_Description: "",
                  HSN_Code: "",
                  Quantity: "",
                  Unit: "TON",
                  Rate: "",
                  Taxable_Amount: "",
                  GST_Rate: 5,
                  GST_Amount: "",
                  Total_Amount: "",
                },
              ],
      });
      setOriginalInvoiceNo(invoice.Invoice_No || "");
      setMode(initialMode);
      setSavedFeedback(null);
      setValidationError(null);
    }
  }, [invoice, initialMode]);

  if (!invoice) return null;

  // Live HTML generation using whatever is in editData
  const htmlContent = generateTaxInvoiceHtml(editData);

  const handleHeaderChange = (field: keyof TaxInvoiceData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationError) setValidationError(null);
  };

  const handleCopyBilledToShipped = () => {
    setEditData((prev) => ({
      ...prev,
      Shipped_To_Name: prev.Billed_To_Name || "",
      Shipped_To_Address: prev.Billed_To_Address || "",
      Shipped_To_State: prev.Billed_To_State || "Gujarat, India",
      Shipped_To_State_Code: prev.Billed_To_State_Code || "24",
    }));
  };

  const recalculateTotals = (itemsList: TaxInvoiceItem[]) => {
    let subtotalTaxable = 0;
    let subtotalGst = 0;

    itemsList.forEach((it) => {
      const taxVal =
        typeof it.Taxable_Amount === "number"
          ? it.Taxable_Amount
          : parseFloat(String(it.Taxable_Amount || 0));
      const gstVal =
        typeof it.GST_Amount === "number"
          ? it.GST_Amount
          : parseFloat(String(it.GST_Amount || 0));
      subtotalTaxable += isNaN(taxVal) ? 0 : taxVal;
      subtotalGst += isNaN(gstVal) ? 0 : gstVal;
    });

    const isIntraState =
      editData.Billed_To_State_Code === "24" ||
      editData.Place_Of_Supply?.toUpperCase().includes("GUJARAT") ||
      !editData.Place_Of_Supply;

    const cgst = subtotalGst / 2;
    const sgst = subtotalGst / 2;
    const round = parseFloat(String(editData.Round_Off || 0));
    const grandTotal = subtotalTaxable + subtotalGst + (isNaN(round) ? 0 : round);

    return {
      Total_Amount_Before_Tax: Number(subtotalTaxable.toFixed(2)),
      CGST_Amount: isIntraState ? Number(cgst.toFixed(2)) : 0,
      SGST_Amount: isIntraState ? Number(sgst.toFixed(2)) : 0,
      IGST_Amount: !isIntraState ? Number(subtotalGst.toFixed(2)) : 0,
      Total_Amount_After_Tax: Number(grandTotal.toFixed(2)),
      Amount_In_Words: numberToWordsIndian(grandTotal),
    };
  };

  const handleTaxChange = (field: keyof TaxInvoiceData, value: string) => {
    setEditData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (
        field === "CGST_Amount" ||
        field === "SGST_Amount" ||
        field === "Round_Off" ||
        field === "Total_Amount_Before_Tax"
      ) {
        const taxable = parseFloat(
          String(field === "Total_Amount_Before_Tax" ? value : updated.Total_Amount_Before_Tax || 0)
        );
        const cgst = parseFloat(
          String(field === "CGST_Amount" ? value : updated.CGST_Amount || 0)
        );
        const sgst = parseFloat(
          String(field === "SGST_Amount" ? value : updated.SGST_Amount || 0)
        );
        const round = parseFloat(
          String(field === "Round_Off" ? value : updated.Round_Off || 0)
        );

        const grand =
          (isNaN(taxable) ? 0 : taxable) +
          (isNaN(cgst) ? 0 : cgst) +
          (isNaN(sgst) ? 0 : sgst) +
          (isNaN(round) ? 0 : round);

        updated.Total_Amount_After_Tax = Number(grand.toFixed(2));
        updated.Amount_In_Words = numberToWordsIndian(grand);
      }

      return updated;
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof TaxInvoiceItem,
    value: string
  ) => {
    setEditData((prev) => {
      const nextItems = [...prev.items];
      const current = { ...nextItems[index], [field]: value };

      // Auto-recalculate if Quantity or Rate or GST_Rate changes
      const rawG = field === "GST_Rate" ? value : (current.GST_Rate !== undefined ? current.GST_Rate : 5);
      const parsedG = parseFloat(String(rawG).replace(/%/g, "").trim());
      const gstRateNum = isNaN(parsedG) ? 0 : parsedG;
      if (field === "GST_Rate") current.GST_Rate = value;

      if (field === "Quantity" || field === "Rate" || field === "GST_Rate") {
        const rawQ = field === "Quantity" ? value : (current.Quantity ?? 0);
        const rawR = field === "Rate" ? value : (current.Rate ?? 0);
        const qtyNum = parseFloat(String(rawQ));
        const rateNum = parseFloat(String(rawR));

        if (!isNaN(qtyNum) && !isNaN(rateNum) && qtyNum > 0 && rateNum > 0) {
          const taxable = qtyNum * rateNum;
          current.Taxable_Amount = Number(taxable.toFixed(2));
          const gstAmount = (taxable * gstRateNum) / 100;
          current.GST_Amount = Number(gstAmount.toFixed(2));
          current.Total_Amount = Number((taxable + gstAmount).toFixed(2));
        }
      } else if (field === "GST_Amount") {
        const taxable =
          typeof current.Taxable_Amount === "number"
            ? current.Taxable_Amount
            : parseFloat(String(current.Taxable_Amount || 0));
        const customGst = parseFloat(value || "0");
        if (!isNaN(taxable) && !isNaN(customGst)) {
          current.Total_Amount = Number((taxable + customGst).toFixed(2));
        }
      }

      const currentHsn = (current.HSN_Code || "").trim();
      current.Tax_Subtext = currentHsn
        ? `GST-${gstRateNum}% (HSN ${currentHsn})`
        : `GST-${gstRateNum}%`;

      nextItems[index] = current;
      const totals = recalculateTotals(nextItems);

      return {
        ...prev,
        items: nextItems,
        ...totals,
      };
    });
  };

  const handleAddItem = () => {
    setEditData((prev) => {
      const nextItems = [
        ...prev.items,
        {
          Sr: prev.items.length + 1,
          Item_Description: "",
          HSN_Code: "",
          Quantity: "",
          Unit: "TON",
          Rate: "",
          Taxable_Amount: "",
          GST_Rate: 5,
          GST_Amount: "",
          Total_Amount: "",
        },
      ];
      return {
        ...prev,
        items: nextItems,
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditData((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [
            {
              Sr: 1,
              Item_Description: "",
              HSN_Code: "",
              Quantity: "",
              Unit: "TON",
              Rate: "",
              Taxable_Amount: "",
              GST_Rate: 5,
              GST_Amount: "",
              Total_Amount: "",
            },
          ],
        };
      }
      const nextItems = prev.items
        .filter((_, i) => i !== index)
        .map((it, idx) => ({ ...it, Sr: idx + 1 }));
      const totals = recalculateTotals(nextItems);
      return {
        ...prev,
        items: nextItems,
        ...totals,
      };
    });
  };

  const handleResetToOriginal = () => {
    if (!invoice) return;
    setEditData({
      ...invoice,
      docType: "invoice",
      Shipped_To_Name: invoice.Shipped_To_Name || invoice.Billed_To_Name || "Reliance New Solar Energy Limited",
      Shipped_To_Address:
        invoice.Shipped_To_Address ||
        invoice.Billed_To_Address ||
        "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
      items:
        Array.isArray(invoice.items) && invoice.items.length > 0
          ? invoice.items.map((it) => ({ ...it }))
          : [],
    });
    setValidationError(null);
    setSavedFeedback("Reset to uploaded spreadsheet values.");
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleSave = (switchModeToPreview = true): boolean => {
    if (!editData.Invoice_No.trim()) {
      setValidationError("Invoice Number cannot be empty.");
      return false;
    }

    const cleanedData: TaxInvoiceData = {
      ...editData,
      docType: "invoice",
      Invoice_No: editData.Invoice_No.trim(),
      Invoice_Date: formatDateIndian(editData.Invoice_Date?.trim() || ""),
      DC_No: editData.DC_No?.trim() || "",
      DC_Date: formatDateIndian(editData.DC_Date?.trim() || editData.Invoice_Date?.trim() || ""),
      PO_No: editData.PO_No?.trim() || "",
      Vehicle_No: editData.Vehicle_No?.trim() || "",

      // Company Header (Emergency Override)
      Company_Name: editData.Company_Name?.trim() || "ANASTOMOSIS ENTERPRISE LLP",
      Company_Address:
        editData.Company_Address?.trim() ||
        "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India",
      Company_GSTIN: editData.Company_GSTIN?.trim() || "24ABWFA7922J1ZY",

      Billed_To_Name: editData.Billed_To_Name?.trim() || "",
      Billed_To_Address: editData.Billed_To_Address?.trim() || "",
      Shipped_To_Name: editData.Shipped_To_Name?.trim() || "",
      Shipped_To_Address: editData.Shipped_To_Address?.trim() || "",
      Shipped_To_State: editData.Shipped_To_State?.trim() || "Gujarat, India",
      Shipped_To_State_Code: editData.Shipped_To_State_Code?.trim() || "24",
      Buyer_GSTIN: editData.Buyer_GSTIN?.trim() || "",
      Buyer_PAN: editData.Buyer_PAN?.trim() || "",
      Vendor_Code: editData.Vendor_Code?.trim() || "",
      Place_Of_Supply: editData.Place_Of_Supply?.trim() || "GUJARAT",

      // Footer & Signatory (Emergency Override)
      Terms_Conditions: editData.Terms_Conditions,
      Signatory_Company_Text: editData.Signatory_Company_Text?.trim() || "FOR ANASTOMOSIS ENTERPRISE LLP",
      Signatory_Label: editData.Signatory_Label?.trim() || "Authorised Signature",
      CGST_Rate: editData.CGST_Rate !== undefined ? editData.CGST_Rate : "2.5%",
      CGST_Amount: editData.CGST_Amount !== undefined ? editData.CGST_Amount : "",
      SGST_Rate: editData.SGST_Rate !== undefined ? editData.SGST_Rate : "2.5%",
      SGST_Amount: editData.SGST_Amount !== undefined ? editData.SGST_Amount : "",
      Round_Off: editData.Round_Off !== undefined ? editData.Round_Off : 0,
      Total_Amount_After_Tax: editData.Total_Amount_After_Tax,
      Amount_In_Words: editData.Amount_In_Words,
      items: editData.items.map((it, idx) => {
        const rawG = it.GST_Rate !== undefined && it.GST_Rate !== null && it.GST_Rate !== ""
          ? parseFloat(String(it.GST_Rate).replace(/%/g, ""))
          : 0;
        const gRate = isNaN(rawG) ? 0 : rawG;
        const hsn = (it.HSN_Code || "").trim();
        return {
          ...it,
          Sr: idx + 1,
          Item_Description: (it.Item_Description || "").trim(),
          HSN_Code: hsn,
          Unit: (it.Unit || "").trim(),
          GST_Rate: gRate,
          Tax_Subtext: hsn ? `GST-${gRate}% (HSN ${hsn})` : `GST-${gRate}%`,
        };
      }),
    };

    if (onSave) {
      onSave(cleanedData, originalInvoiceNo);
    }

    setOriginalInvoiceNo(cleanedData.Invoice_No);
    setEditData(cleanedData);
    setValidationError(null);
    setSavedFeedback("Bill of Supply saved successfully! Preview & batch list updated.");
    setTimeout(() => setSavedFeedback(null), 4000);

    if (switchModeToPreview) {
      setMode("preview");
    }
    return true;
  };

  const handleDownload = async (openInNewTab = false) => {
    try {
      setDownloading(true);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <datalist id="tax-invoice-units">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>BILL OF SUPPLY</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                    {editData.Invoice_No || "Untitled"}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                {mode === "edit"
                  ? "Modify buyer details, shipped-to details, line items, and CGST/SGST amounts"
                  : "Live print-ready Bill of Supply matching official format"}
              </p>
            </div>

            {/* Toggle Mode */}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {mode === "preview" ? (
              <>
                <button
                  onClick={() => setMode("edit")}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>

                <button
                  onClick={handleOpenNewTab}
                  type="button"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full Screen</span>
                </button>

                <button
                  onClick={() => handleDownload(true)}
                  disabled={downloading}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
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
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banners */}
        {savedFeedback && (
          <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{savedFeedback}</span>
          </div>
        )}

        {validationError && (
          <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-6">
          {mode === "preview" ? (
            /* Document Live Iframe Preview */
            <div className="flex justify-center">
              <div className="w-full max-w-[210mm] bg-white shadow-xl rounded-sm overflow-hidden min-h-[550px]">
                <iframe
                  srcDoc={htmlContent}
                  title="Bill of Supply Document Preview"
                  className="w-full h-[760px] border-none"
                />
              </div>
            </div>
          ) : (
            /* Edit Form Interface */
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Card 0: Company Header (Emergency Override) */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/60 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-3">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Company Header (Emergency Override)</span>
                  </h4>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-mono">
                    Issuer Branding
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Issuer Company Name
                    </label>
                    <input
                      type="text"
                      value={editData.Company_Name || ""}
                      onChange={(e) => handleHeaderChange("Company_Name", e.target.value)}
                      placeholder="ANASTOMOSIS ENTERPRISE LLP"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Issuer GSTIN
                    </label>
                    <input
                      type="text"
                      value={editData.Company_GSTIN || ""}
                      onChange={(e) => handleHeaderChange("Company_GSTIN", e.target.value)}
                      placeholder="24ABWFA7922J1ZY"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Issuer Office Address
                    </label>
                    <textarea
                      rows={2}
                      value={editData.Company_Address || ""}
                      onChange={(e) => handleHeaderChange("Company_Address", e.target.value)}
                      placeholder="A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 resize-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Card 1: Invoice Meta & Buyer / Shipped Details */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Invoice & Parties Details</span>
                  </h4>
                  <span className="text-xs text-zinc-400 font-mono">
                    Issuer: ANASTOMOSIS ENTERPRISE LLP (24ABWFA7922J1ZY)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-zinc-400" />
                      <span>Invoice No *</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Invoice_No}
                      onChange={(e) => handleHeaderChange("Invoice_No", e.target.value)}
                      placeholder="e.g. 186-J/26-27"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>Invoice Date</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Invoice_Date || ""}
                      onChange={(e) => handleHeaderChange("Invoice_Date", e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-zinc-400" />
                      <span>DC No</span>
                    </label>
                    <input
                      type="text"
                      value={editData.DC_No || ""}
                      onChange={(e) => handleHeaderChange("DC_No", e.target.value)}
                      placeholder="e.g. 186-J/26-27"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>DC Date</span>
                    </label>
                    <input
                      type="text"
                      value={editData.DC_Date || ""}
                      onChange={(e) => handleHeaderChange("DC_Date", e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <PackageCheck className="w-3 h-3 text-zinc-400" />
                      <span>PO No</span>
                    </label>
                    <input
                      type="text"
                      value={editData.PO_No || ""}
                      onChange={(e) => handleHeaderChange("PO_No", e.target.value)}
                      placeholder="e.g. 241128166"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-zinc-400" />
                      <span>Vehicle No</span>
                    </label>
                    <input
                      type="text"
                      value={editData.Vehicle_No || ""}
                      onChange={(e) => handleHeaderChange("Vehicle_No", e.target.value)}
                      placeholder="e.g. MH41AU8917"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Place of Supply
                    </label>
                    <input
                      type="text"
                      value={editData.Place_Of_Supply || ""}
                      onChange={(e) => handleHeaderChange("Place_Of_Supply", e.target.value)}
                      placeholder="GUJARAT"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Buyer GSTIN
                    </label>
                    <input
                      type="text"
                      value={editData.Buyer_GSTIN || ""}
                      onChange={(e) => handleHeaderChange("Buyer_GSTIN", e.target.value)}
                      placeholder="24AALCR0464R1ZT"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Buyer PAN
                    </label>
                    <input
                      type="text"
                      value={editData.Buyer_PAN || ""}
                      onChange={(e) => handleHeaderChange("Buyer_PAN", e.target.value)}
                      placeholder="AALCR0464R"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Vendor Code
                    </label>
                    <input
                      type="text"
                      value={editData.Vendor_Code || ""}
                      onChange={(e) => handleHeaderChange("Vendor_Code", e.target.value)}
                      placeholder="3778226"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>
                </div>

                {/* Billed To & Shipped To Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Billed To Box */}
                  <div className="space-y-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Billed To (Details of Receiver)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Company / Entity Name
                      </label>
                      <input
                        type="text"
                        value={editData.Billed_To_Name || ""}
                        onChange={(e) => handleHeaderChange("Billed_To_Name", e.target.value)}
                        placeholder="M/S. Reliance New Solar Energy Limited"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Full Address & District
                      </label>
                      <textarea
                        rows={2}
                        value={editData.Billed_To_Address || ""}
                        onChange={(e) => handleHeaderChange("Billed_To_Address", e.target.value)}
                        placeholder="Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Shipped To Box (Editable!) */}
                  <div className="space-y-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Shipped To (Consignee)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyBilledToShipped}
                        className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Copy from Billed To
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Shipped To Entity Name
                      </label>
                      <input
                        type="text"
                        value={editData.Shipped_To_Name || ""}
                        onChange={(e) => handleHeaderChange("Shipped_To_Name", e.target.value)}
                        placeholder="Reliance New Solar Energy Limited"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Shipped To Full Address
                      </label>
                      <textarea
                        rows={2}
                        value={editData.Shipped_To_Address || ""}
                        onChange={(e) => handleHeaderChange("Shipped_To_Address", e.target.value)}
                        placeholder="Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Line Items with Editable Rates & GST Amounts */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Line Items ({editData.items.length})
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      GST Amount is directly editable
                    </span>
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
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-zinc-500 mt-1">#{idx + 1}</span>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          {/* Description */}
                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Description of Goods
                            </label>
                            <input
                              type="text"
                              value={item.Item_Description || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "Item_Description", e.target.value)
                              }
                              placeholder="e.g. CORN STEEP LIQ_CBG"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                            />
                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                              <span className="font-medium text-blue-600 dark:text-blue-400">Bill Subtext:</span>
                              <span className="font-mono bg-zinc-200/70 dark:bg-zinc-700/70 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-semibold">
                                {item.Tax_Subtext || (item.HSN_Code ? `GST-${item.GST_Rate ?? 5}% (HSN ${item.HSN_Code})` : `GST-${item.GST_Rate ?? 5}%`)}
                              </span>
                            </div>
                          </div>

                          {/* HSN Code */}
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              HSN Code
                            </label>
                            <input
                              type="text"
                              value={item.HSN_Code || ""}
                              onChange={(e) => handleItemChange(idx, "HSN_Code", e.target.value)}
                              placeholder="23031000"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-center"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Qty
                            </label>
                            <input
                              type="text"
                              value={item.Quantity !== undefined ? String(item.Quantity) : ""}
                              onChange={(e) => handleItemChange(idx, "Quantity", e.target.value)}
                              placeholder="33.95"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-medium"
                            />
                          </div>

                          {/* Unit */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              list="tax-invoice-units"
                              value={item.Unit || ""}
                              onChange={(e) => handleItemChange(idx, "Unit", e.target.value)}
                              placeholder="TON"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center uppercase"
                            />
                          </div>

                          {/* Rate */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Rate
                            </label>
                            <input
                              type="text"
                              value={item.Rate !== undefined ? String(item.Rate) : ""}
                              onChange={(e) => handleItemChange(idx, "Rate", e.target.value)}
                              placeholder="1190.00"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-mono"
                            />
                          </div>

                          {/* Taxable Amount */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              Taxable
                            </label>
                            <input
                              type="text"
                              value={item.Taxable_Amount !== undefined ? String(item.Taxable_Amount) : ""}
                              onChange={(e) =>
                                handleItemChange(idx, "Taxable_Amount", e.target.value)
                              }
                              placeholder="40400.50"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-bold text-zinc-900 dark:text-zinc-100"
                            />
                          </div>

                          {/* GST Rate */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                              GST %
                            </label>
                            <input
                              type="text"
                              value={item.GST_Rate !== undefined ? String(item.GST_Rate) : "5"}
                              onChange={(e) => handleItemChange(idx, "GST_Rate", e.target.value)}
                              placeholder="5"
                              className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
                            />
                          </div>

                          {/* GST Amount (Editable!) */}
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1">
                              GST Amt *
                            </label>
                            <input
                              type="text"
                              value={item.GST_Amount !== undefined ? String(item.GST_Amount) : ""}
                              onChange={(e) => handleItemChange(idx, "GST_Amount", e.target.value)}
                              placeholder="2020.03"
                              className="w-full px-2 py-1.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-800 text-right font-medium text-blue-700 dark:text-blue-300"
                            />
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Tax Breakdown & Summary (Editable CGST, SGST, Round Off) */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Tax Breakdown & Summary
                  </h4>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    CGST & SGST Rates and Amounts are fully editable
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Total Before Tax
                    </label>
                    <input
                      type="text"
                      value={editData.Total_Amount_Before_Tax !== undefined ? String(editData.Total_Amount_Before_Tax) : ""}
                      onChange={(e) => handleTaxChange("Total_Amount_Before_Tax", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-zinc-600 dark:text-zinc-400">CGST %</label>
                      <label className="font-medium text-blue-600 dark:text-blue-400">CGST Amt *</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editData.CGST_Rate !== undefined ? String(editData.CGST_Rate) : "2.5%"}
                        onChange={(e) => handleTaxChange("CGST_Rate", e.target.value)}
                        placeholder="2.5%"
                        className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-medium"
                      />
                      <input
                        type="text"
                        value={editData.CGST_Amount !== undefined ? String(editData.CGST_Amount) : ""}
                        onChange={(e) => handleTaxChange("CGST_Amount", e.target.value)}
                        placeholder="1010.01"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-800 font-mono text-right font-bold text-blue-700 dark:text-blue-300"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-zinc-600 dark:text-zinc-400">SGST %</label>
                      <label className="font-medium text-blue-600 dark:text-blue-400">SGST Amt *</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editData.SGST_Rate !== undefined ? String(editData.SGST_Rate) : "2.5%"}
                        onChange={(e) => handleTaxChange("SGST_Rate", e.target.value)}
                        placeholder="2.5%"
                        className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-medium"
                      />
                      <input
                        type="text"
                        value={editData.SGST_Amount !== undefined ? String(editData.SGST_Amount) : ""}
                        onChange={(e) => handleTaxChange("SGST_Amount", e.target.value)}
                        placeholder="1010.01"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-zinc-800 font-mono text-right font-bold text-blue-700 dark:text-blue-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Round Off
                    </label>
                    <input
                      type="text"
                      value={editData.Round_Off !== undefined ? String(editData.Round_Off) : "0.00"}
                      onChange={(e) => handleTaxChange("Round_Off", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-blue-600 dark:text-blue-400 mb-1">
                      Total After Tax
                    </label>
                    <input
                      type="text"
                      value={editData.Total_Amount_After_Tax !== undefined ? String(editData.Total_Amount_After_Tax) : ""}
                      onChange={(e) => handleHeaderChange("Total_Amount_After_Tax", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 font-bold text-blue-700 dark:text-blue-300 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Amount In Words
                  </label>
                  <input
                    type="text"
                    value={editData.Amount_In_Words || ""}
                    onChange={(e) => handleHeaderChange("Amount_In_Words", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium uppercase"
                  />
                </div>
              </div>

              {/* Card 5: Terms & Signatory (Emergency Override) */}
              <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/60 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-3">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Terms & Signatory (Emergency Override)</span>
                  </h4>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-mono">
                    Footer Branding
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Terms & Conditions (Left Footer Column)
                    </label>
                    <textarea
                      rows={4}
                      value={editData.Terms_Conditions || ""}
                      onChange={(e) => handleHeaderChange("Terms_Conditions", e.target.value)}
                      placeholder={`1. 50% advance payment along with Purchase order...\n2. Goods once sold will not be taken back...`}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Signatory Header
                    </label>
                    <input
                      type="text"
                      value={editData.Signatory_Company_Text || ""}
                      onChange={(e) => handleHeaderChange("Signatory_Company_Text", e.target.value)}
                      placeholder="FOR ANASTOMOSIS ENTERPRISE LLP"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Signatory Bottom Label
                    </label>
                    <input
                      type="text"
                      value={editData.Signatory_Label || ""}
                      onChange={(e) => handleHeaderChange("Signatory_Label", e.target.value)}
                      placeholder="Authorised Signature"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer for Edit Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Tip: Saving will update the live preview and the batch list.
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
