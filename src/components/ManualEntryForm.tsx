"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  FileCheck2,
  Eye,
  Loader2,
  RotateCcw,
  Sparkles,
  Calendar,
  Truck,
  Hash,
  Package,
  Building2,
  MapPin,
} from "lucide-react";
import { InvoiceData, InvoiceItem } from "@/types/invoice";
import { formatDateIndian } from "@/lib/dateUtils";
import InvoicePreviewModal from "./InvoicePreviewModal";

interface ManualEntryFormProps {
  onDownloadPdf: (invoice: InvoiceData, openInNewTab?: boolean) => Promise<void>;
}

const INITIAL_ITEM: InvoiceItem = {
  Item_Description: "",
  HSN_Code: "",
  Quantity: "",
  Unit: "TON",
};

export default function ManualEntryForm({ onDownloadPdf }: ManualEntryFormProps) {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dcNo, setDcNo] = useState("");
  const [dcDate, setDcDate] = useState("");
  const [poNo, setPoNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [location, setLocation] = useState("NAVSARI CBG");
  const [buyerName, setBuyerName] = useState("M/S. Reliance Industries Limited");
  const [buyerAddress, setBuyerAddress] = useState(
    "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
  );
  const [shippedToName, setShippedToName] = useState("M/S. Reliance Industries Limited");
  const [shippedToAddress, setShippedToAddress] = useState(
    "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
  );
  const [sameAsBilledTo, setSameAsBilledTo] = useState(true);
  const [buyerGstin, setBuyerGstin] = useState("24AAACR5055K1ZD");
  const [buyerPan, setBuyerPan] = useState("AAACR5055K");
  const [vendorCode, setVendorCode] = useState("3778226");
  const [items, setItems] = useState<InvoiceItem[]>([{ ...INITIAL_ITEM }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...INITIAL_ITEM }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = {
        ...updated[index],
        [field]: value,
      };
      const hsn = (current.HSN_Code || "").trim();
      current.Tax_Subtext = hsn ? `GST-0% (HSN ${hsn})` : "GST-0%";
      updated[index] = current;
      return updated;
    });
  };

  const handleFillSample = () => {
    setInvoiceNo("AE134-N/26-27");
    setInvoiceDate("27/10/2026");
    setDcNo("AE134-N/26-27");
    setDcDate("27/10/2026");
    setPoNo("241128591");
    setVehicleNo("RJ09GE7594");
    setLocation("NAVSARI CBG");
    setBuyerName("M/S. Reliance Industries Limited");
    setBuyerAddress("Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433");
    setShippedToName("M/S. Reliance Industries Limited");
    setShippedToAddress("Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433");
    setSameAsBilledTo(true);
    setBuyerGstin("24AAACR5055K1ZD");
    setBuyerPan("AAACR5055K");
    setVendorCode("3778226");
    setItems([
      {
        Item_Description: "MSW_CBG",
        HSN_Code: "3825 10 00",
        Quantity: "40.000",
        Unit: "TON",
        Tax_Subtext: "GST-0% (HSN 3825 10 00)",
      },
    ]);
    setFormError(null);
  };

  const handleReset = () => {
    setInvoiceNo("");
    setInvoiceDate("");
    setDcNo("");
    setDcDate("");
    setPoNo("");
    setVehicleNo("");
    setLocation("NAVSARI CBG");
    setBuyerName("");
    setBuyerAddress("");
    setShippedToName("");
    setShippedToAddress("");
    setSameAsBilledTo(true);
    setBuyerGstin("");
    setBuyerPan("");
    setVendorCode("");
    setItems([{ ...INITIAL_ITEM }]);
    setFormError(null);
  };

  const getCurrentInvoiceData = (): InvoiceData => {
    return {
      Invoice_No: invoiceNo.trim(),
      Invoice_Date: formatDateIndian(invoiceDate.trim()),
      DC_No: dcNo.trim() || invoiceNo.trim(),
      DC_Date: formatDateIndian(dcDate.trim() || invoiceDate.trim()),
      PO_No: poNo.trim() || "241128591",
      Vehicle_No: vehicleNo.trim() || "RJ09GE7594",
      Location: location.trim() || "NAVSARI CBG",
      Buyer_Name: buyerName.trim(),
      Buyer_Address: buyerAddress.trim(),
      Shipped_To_Name: (sameAsBilledTo ? buyerName : shippedToName).trim(),
      Shipped_To_Address: (sameAsBilledTo ? buyerAddress : shippedToAddress).trim(),
      Buyer_GSTIN: buyerGstin.trim(),
      Buyer_PAN: buyerPan.trim(),
      Vendor_Code: vendorCode.trim(),
      items: items.map((it) => ({
        Item_Description: (it.Item_Description || "").trim(),
        HSN_Code: (it.HSN_Code || "").trim(),
        Quantity: it.Quantity !== undefined && it.Quantity !== null ? String(it.Quantity).trim() : "",
        Unit: (it.Unit || "TON").trim(),
        Tax_Subtext: it.HSN_Code ? `GST-0% (HSN ${it.HSN_Code})` : "GST-0%",
      })),
    };
  };

  const handleSaveFromPreview = (updated: InvoiceData) => {
    setInvoiceNo(updated.Invoice_No || "");
    setInvoiceDate(updated.Invoice_Date || "");
    setDcNo(updated.DC_No || "");
    setDcDate(updated.DC_Date || "");
    setPoNo(updated.PO_No || "");
    setVehicleNo(updated.Vehicle_No || "");
    setLocation(updated.Location || "NAVSARI CBG");
    setBuyerName(updated.Buyer_Name || "");
    setBuyerAddress(updated.Buyer_Address || "");
    setShippedToName(updated.Shipped_To_Name || updated.Buyer_Name || "");
    setShippedToAddress(updated.Shipped_To_Address || updated.Buyer_Address || "");
    setBuyerGstin(updated.Buyer_GSTIN || "");
    setBuyerPan(updated.Buyer_PAN || "");
    setVendorCode(updated.Vendor_Code || "");
    setItems(
      Array.isArray(updated.items) && updated.items.length > 0
        ? updated.items
        : [{ ...INITIAL_ITEM }]
    );
    setPreviewInvoice(updated);
  };

  const handleGenerate = async (openInNewTab = false) => {
    setFormError(null);
    const invoiceData = getCurrentInvoiceData();

    if (!invoiceData.Invoice_No) {
      setFormError("Invoice_No is required to name and group the Delivery Challan.");
      return;
    }

    try {
      setIsGenerating(true);
      await onDownloadPdf(invoiceData, openInNewTab);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF generation failed";
      setFormError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleGenerate(false);
  };

  const totalQuantity = items.reduce((sum, item) => {
    const q = typeof item.Quantity === "number" ? item.Quantity : parseFloat(String(item.Quantity || 0));
    return isNaN(q) ? sum : sum + q;
  }, 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Manual Delivery Challan Creator</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Any field left blank will strictly remain completely empty on the generated PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Fill Sample Data</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300">
            {formError}
          </div>
        )}

        {/* Header Fields Section */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-blue-500" />
            <span>Document & Header Information</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Invoice_No */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Invoice No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-2026-0891"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Invoice_Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invoice Date</span>
                <span className="text-[10px] text-zinc-400 font-mono">(DD/MM/YYYY)</span>
              </label>
              <input
                type="text"
                placeholder="27/10/2026"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* DC_No */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Delivery Challan No. (DC_No)
              </label>
              <input
                type="text"
                placeholder="e.g. DC-2026-4401"
                value={dcNo}
                onChange={(e) => setDcNo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* DC_Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Challan Date</span>
                <span className="text-[10px] text-zinc-400 font-mono">(DD/MM/YYYY)</span>
              </label>
              <input
                type="text"
                placeholder="27/10/2026"
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* PO_No */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Purchase Order No. (PO_No)
              </label>
              <input
                type="text"
                placeholder="e.g. RIL-PO-982104"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vehicle_No */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Vehicle No.
              </label>
              <input
                type="text"
                placeholder="e.g. RJ09GE7594"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location / CBG Site */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Location / Site
              </label>
              <input
                type="text"
                placeholder="e.g. NAVSARI CBG"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Receiver & Shipping Information (Billed To, Shipped To, GST NO. & PAN NO.) */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Receiver & Shipping Information (Billed To & Shipped To)</span>
            </h4>
            <span className="text-xs text-zinc-400 font-mono">
              Delivery Challan Parties
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Box 1: Billed To Details */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Details of Receiver (Billed To)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Receiver Name (Billed To)
                </label>
                <input
                  type="text"
                  placeholder="M/S. Reliance Industries Limited"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    if (sameAsBilledTo) setShippedToName(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Receiver Address (Billed To)
                </label>
                <textarea
                  rows={3}
                  placeholder="Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
                  value={buyerAddress}
                  onChange={(e) => {
                    setBuyerAddress(e.target.value);
                    if (sameAsBilledTo) setShippedToAddress(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Box 2: Shipped To Details */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                  <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Shipped To (Consignee)</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameAsBilledTo}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsBilledTo(checked);
                      if (checked) {
                        setShippedToName(buyerName);
                        setShippedToAddress(buyerAddress);
                      }
                    }}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Same as Billed To</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Shipped To Name
                </label>
                <input
                  type="text"
                  placeholder="M/S. Reliance Industries Limited"
                  value={sameAsBilledTo ? buyerName : shippedToName}
                  onChange={(e) => setShippedToName(e.target.value)}
                  disabled={sameAsBilledTo}
                  className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    sameAsBilledTo ? "opacity-75 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Shipped To Address
                </label>
                <textarea
                  rows={3}
                  placeholder="Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
                  value={sameAsBilledTo ? buyerAddress : shippedToAddress}
                  onChange={(e) => setShippedToAddress(e.target.value)}
                  disabled={sameAsBilledTo}
                  className={`w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    sameAsBilledTo ? "opacity-75 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Tax & Identifiers Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Receiver GST NO.
              </label>
              <input
                type="text"
                placeholder="e.g. 24AAACR5055K1ZD"
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Receiver PAN NO.
              </label>
              <input
                type="text"
                placeholder="e.g. AAACR5055K"
                value={buyerPan}
                onChange={(e) => setBuyerPan(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Reliance Vendor Code
              </label>
              <input
                type="text"
                placeholder="e.g. 3778226"
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items Fieldset */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>Invoice Items ({items.length})</span>
              </h4>
              {totalQuantity > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md">
                  Total Qty Sum: {Number.isInteger(totalQuantity) ? totalQuantity : totalQuantity.toFixed(2)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center gap-3 relative group"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </div>

                {/* Item_Description */}
                <div className="flex-1 w-full md:w-auto">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Item Description
                  </label>
                  <input
                    type="text"
                    placeholder="Description of goods / materials"
                    value={item.Item_Description || ""}
                    onChange={(e) => handleItemChange(index, "Item_Description", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* HSN_Code */}
                <div className="w-full md:w-32">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7307"
                    value={item.HSN_Code || ""}
                    onChange={(e) => handleItemChange(index, "HSN_Code", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Quantity */}
                <div className="w-full md:w-28">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Qty"
                    value={item.Quantity !== undefined ? item.Quantity : ""}
                    onChange={(e) => handleItemChange(index, "Quantity", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Unit */}
                <div className="w-full md:w-28">
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="NOS / SET"
                    value={item.Unit || ""}
                    onChange={(e) => handleItemChange(index, "Unit", e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Delete button */}
                <div className="self-end md:self-center pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit / Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPreviewInvoice(getCurrentInvoiceData())}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Challan</span>
          </button>

          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            title="Open generated PDF directly in a new browser tab"
          >
            <span>Open PDF</span>
          </button>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Generate & Download PDF</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onDownload={onDownloadPdf}
          onSave={handleSaveFromPreview}
        />
      )}
    </div>
  );
}
