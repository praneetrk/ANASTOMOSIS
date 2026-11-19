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
  Percent,
} from "lucide-react";
import { TaxInvoiceData, TaxInvoiceItem } from "@/types/taxInvoice";
import { numberToWordsIndian } from "@/lib/numberToWords";
import { formatDateIndian } from "@/lib/dateUtils";
import TaxInvoicePreviewModal from "./TaxInvoicePreviewModal";

interface TaxInvoiceManualEntryFormProps {
  onDownloadPdf: (invoice: TaxInvoiceData, openInNewTab?: boolean) => Promise<void>;
}

const INITIAL_ITEM: TaxInvoiceItem = {
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
};

export default function TaxInvoiceManualEntryForm({
  onDownloadPdf,
}: TaxInvoiceManualEntryFormProps) {
  const [invoiceNo, setInvoiceNo] = useState("186-J/26-27");
  const [invoiceDate, setInvoiceDate] = useState("31/10/2026");
  const [dcNo, setDcNo] = useState("186-J/26-27");
  const [dcDate, setDcDate] = useState("31/10/2026");
  const [poNo, setPoNo] = useState("241128166");
  const [vehicleNo, setVehicleNo] = useState("MH41AU8917");

  // Billed To
  const [billedToName, setBilledToName] = useState(
    "M/S. Reliance New Solar Energy Limited"
  );
  const [billedToAddress, setBilledToAddress] = useState(
    "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
  );

  // Shipped To (Editable!)
  const [shippedToName, setShippedToName] = useState(
    "Reliance New Solar Energy Limited"
  );
  const [shippedToAddress, setShippedToAddress] = useState(
    "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
  );

  const [buyerGstin, setBuyerGstin] = useState("24AALCR0464R1ZT");
  const [buyerPan, setBuyerPan] = useState("AALCR0464R");
  const [vendorCode, setVendorCode] = useState("3778226");
  const [placeOfSupply, setPlaceOfSupply] = useState("GUJARAT");

  // Tax Editable States
  const [cgstRate, setCgstRate] = useState("2.5%");
  const [cgstAmount, setCgstAmount] = useState("1010.01");
  const [sgstRate, setSgstRate] = useState("2.5%");
  const [sgstAmount, setSgstAmount] = useState("1010.01");
  const [roundOff, setRoundOff] = useState("0.00");
  const [isTaxManual, setIsTaxManual] = useState(false);

  const [items, setItems] = useState<TaxInvoiceItem[]>([
    {
      Sr: 1,
      Item_Description: "CORN STEEP LIQ_CBG",
      HSN_Code: "23031000",
      Quantity: "33.95",
      Unit: "TON",
      Rate: "1190.00",
      Taxable_Amount: "40400.50",
      GST_Rate: 5,
      GST_Amount: "2020.03",
      Total_Amount: "42420.53",
      Tax_Subtext: "GST-5% (HSN 2303 10 00)",
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<TaxInvoiceData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCopyBilledToShipped = () => {
    setShippedToName(billedToName);
    setShippedToAddress(billedToAddress);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ...INITIAL_ITEM,
        Sr: prev.length + 1,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, Sr: idx + 1 }))
    );
  };

  const handleItemChange = (
    index: number,
    field: keyof TaxInvoiceItem,
    value: string
  ) => {
    setItems((prev) => {
      const nextItems = [...prev];
      const current = { ...nextItems[index], [field]: value };

      // Determine GST rate safely (0% is a valid rate, not falsy 5)
      const rawGst = field === "GST_Rate" ? value : (current.GST_Rate !== undefined ? current.GST_Rate : 5);
      const parsedGst = parseFloat(String(rawGst).replace(/%/g, "").trim());
      const g = isNaN(parsedGst) ? 0 : parsedGst;
      if (field === "GST_Rate") current.GST_Rate = value;

      if (field === "Quantity" || field === "Rate" || field === "GST_Rate") {
        const rawQ = field === "Quantity" ? value : (current.Quantity ?? 0);
        const rawR = field === "Rate" ? value : (current.Rate ?? 0);
        const q = parseFloat(String(rawQ));
        const r = parseFloat(String(rawR));

        if (!isNaN(q) && !isNaN(r) && q > 0 && r > 0) {
          const taxable = q * r;
          current.Taxable_Amount = taxable.toFixed(2);
          const gstAmt = (taxable * g) / 100;
          current.GST_Amount = gstAmt.toFixed(2);
          current.Total_Amount = (taxable + gstAmt).toFixed(2);
        }
      } else if (field === "GST_Amount") {
        const taxable = parseFloat(String(current.Taxable_Amount || 0));
        const customGst = parseFloat(value || "0");
        if (!isNaN(taxable) && !isNaN(customGst)) {
          current.Total_Amount = (taxable + customGst).toFixed(2);
        }
      }

      // Auto update Tax_Subtext based on current HSN and current GST Rate
      const currentHsn = (current.HSN_Code || "").trim();
      current.Tax_Subtext = currentHsn
        ? `GST-${g}% (HSN ${currentHsn})`
        : `GST-${g}%`;

      nextItems[index] = current;

      // Auto update CGST/SGST if not manually overridden
      if (!isTaxManual) {
        let sumGst = 0;
        nextItems.forEach((it) => {
          const gstVal = parseFloat(String(it.GST_Amount || 0));
          if (!isNaN(gstVal)) sumGst += gstVal;
        });
        const half = sumGst / 2;
        setCgstAmount(half.toFixed(2));
        setSgstAmount(half.toFixed(2));
        if (sumGst === 0) {
          setCgstRate("0%");
          setSgstRate("0%");
        } else {
          const halfRate = (g / 2).toFixed(1).replace(/\.0$/, "");
          setCgstRate(`${halfRate}%`);
          setSgstRate(`${halfRate}%`);
        }
      }

      return nextItems;
    });
  };

  const handleFillSample = () => {
    setInvoiceNo("186-J/26-27");
    setInvoiceDate("31/10/2026");
    setDcNo("186-J/26-27");
    setDcDate("31/10/2026");
    setPoNo("241128166");
    setVehicleNo("MH41AU8917");
    setBilledToName("M/S. Reliance New Solar Energy Limited");
    setBilledToAddress(
      "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
    );
    setShippedToName("Reliance New Solar Energy Limited");
    setShippedToAddress(
      "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
    );
    setBuyerGstin("24AALCR0464R1ZT");
    setBuyerPan("AALCR0464R");
    setVendorCode("3778226");
    setPlaceOfSupply("GUJARAT");
    setCgstRate("2.5%");
    setCgstAmount("1010.01");
    setSgstRate("2.5%");
    setSgstAmount("1010.01");
    setRoundOff("0.00");
    setIsTaxManual(false);
    setItems([
      {
        Sr: 1,
        Item_Description: "CORN STEEP LIQ_CBG",
        HSN_Code: "23031000",
        Quantity: "33.95",
        Unit: "TON",
        Rate: "1190.00",
        Taxable_Amount: "40400.50",
        GST_Rate: 5,
        GST_Amount: "2020.03",
        Total_Amount: "42420.53",
        Tax_Subtext: "GST-5% (HSN 2303 10 00)",
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
    setBilledToName("");
    setBilledToAddress("");
    setShippedToName("");
    setShippedToAddress("");
    setCgstAmount("");
    setSgstAmount("");
    setRoundOff("0.00");
    setIsTaxManual(false);
    setItems([{ ...INITIAL_ITEM }]);
    setFormError(null);
  };

  const getCurrentInvoiceData = (): TaxInvoiceData => {
    let taxableSum = 0;
    let gstSum = 0;

    const cleanedItems = items.map((it, idx) => {
      const q = parseFloat(String(it.Quantity || 0));
      const r = parseFloat(String(it.Rate || 0));
      let taxable = parseFloat(String(it.Taxable_Amount || ""));
      if (isNaN(taxable) || taxable === 0) taxable = !isNaN(q) && !isNaN(r) ? q * r : 0;

      let gRate = 0;
      if (it.GST_Rate !== undefined && it.GST_Rate !== null && it.GST_Rate !== "") {
        const p = parseFloat(String(it.GST_Rate).replace(/%/g, "").trim());
        gRate = isNaN(p) ? 0 : p;
      } else {
        gRate = 5;
      }

      let gAmt = parseFloat(String(it.GST_Amount !== undefined && it.GST_Amount !== "" ? it.GST_Amount : ""));
      if (isNaN(gAmt)) gAmt = (taxable * gRate) / 100;

      let total = parseFloat(String(it.Total_Amount !== undefined && it.Total_Amount !== "" ? it.Total_Amount : ""));
      if (isNaN(total) || total === 0) total = taxable + gAmt;

      taxableSum += taxable;
      gstSum += gAmt;

      const hsn = (it.HSN_Code || "").trim();
      const dynamicSubtext = hsn ? `GST-${gRate}% (HSN ${hsn})` : `GST-${gRate}%`;

      return {
        ...it,
        Sr: idx + 1,
        Item_Description: (it.Item_Description || "").trim(),
        HSN_Code: hsn,
        Unit: (it.Unit || "").trim(),
        Taxable_Amount: taxable,
        GST_Rate: gRate,
        GST_Amount: gAmt,
        Total_Amount: total,
        Tax_Subtext: dynamicSubtext,
      };
    });

    const isIntraState = placeOfSupply.toUpperCase().includes("GUJARAT") || !placeOfSupply;
    const computedCgst = parseFloat(cgstAmount || String(gstSum / 2));
    const computedSgst = parseFloat(sgstAmount || String(gstSum / 2));
    const computedRound = parseFloat(roundOff || "0");
    const grandTotal = taxableSum + (isNaN(computedCgst) ? 0 : computedCgst) + (isNaN(computedSgst) ? 0 : computedSgst) + (isNaN(computedRound) ? 0 : computedRound);

    return {
      docType: "invoice",
      Invoice_No: invoiceNo.trim(),
      Invoice_Date: formatDateIndian(invoiceDate.trim()),
      DC_No: dcNo.trim() || invoiceNo.trim(),
      DC_Date: formatDateIndian(dcDate.trim() || invoiceDate.trim()),
      PO_No: poNo.trim(),
      Vehicle_No: vehicleNo.trim(),
      Billed_To_Name: billedToName.trim(),
      Billed_To_Address: billedToAddress.trim(),
      Billed_To_State: "Gujarat, India",
      Billed_To_State_Code: "24",
      Shipped_To_Name: shippedToName.trim() || billedToName.trim(),
      Shipped_To_Address: shippedToAddress.trim() || billedToAddress.trim(),
      Shipped_To_State: "Gujarat, India",
      Shipped_To_State_Code: "24",
      Buyer_GSTIN: buyerGstin.trim(),
      Buyer_PAN: buyerPan.trim(),
      Vendor_Code: vendorCode.trim(),
      Place_Of_Supply: placeOfSupply.trim(),
      items: cleanedItems,
      Total_Amount_Before_Tax: Number(taxableSum.toFixed(2)),
      CGST_Rate: cgstRate,
      CGST_Amount: isIntraState ? Number(computedCgst.toFixed(2)) : 0,
      SGST_Rate: sgstRate,
      SGST_Amount: isIntraState ? Number(computedSgst.toFixed(2)) : 0,
      IGST_Rate: "5%",
      IGST_Amount: !isIntraState ? Number(gstSum.toFixed(2)) : 0,
      Round_Off: Number(computedRound.toFixed(2)),
      Total_Amount_After_Tax: Number(grandTotal.toFixed(2)),
      Amount_In_Words: numberToWordsIndian(grandTotal),
    };
  };

  const handleSaveFromPreview = (updated: TaxInvoiceData) => {
    setInvoiceNo(updated.Invoice_No || "");
    setInvoiceDate(updated.Invoice_Date || "");
    setDcNo(updated.DC_No || "");
    setDcDate(updated.DC_Date || "");
    setPoNo(updated.PO_No || "");
    setVehicleNo(updated.Vehicle_No || "");
    setBilledToName(updated.Billed_To_Name || "");
    setBilledToAddress(updated.Billed_To_Address || "");
    setShippedToName(updated.Shipped_To_Name || updated.Billed_To_Name || "");
    setShippedToAddress(updated.Shipped_To_Address || updated.Billed_To_Address || "");
    setBuyerGstin(updated.Buyer_GSTIN || "");
    setBuyerPan(updated.Buyer_PAN || "");
    setVendorCode(updated.Vendor_Code || "");
    setPlaceOfSupply(updated.Place_Of_Supply || "GUJARAT");
    if (updated.CGST_Rate) setCgstRate(String(updated.CGST_Rate));
    if (updated.CGST_Amount !== undefined) setCgstAmount(String(updated.CGST_Amount));
    if (updated.SGST_Rate) setSgstRate(String(updated.SGST_Rate));
    if (updated.SGST_Amount !== undefined) setSgstAmount(String(updated.SGST_Amount));
    if (updated.Round_Off !== undefined) setRoundOff(String(updated.Round_Off));
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
      setFormError("Invoice Number is required.");
      return;
    }

    try {
      setIsGenerating(true);
      await onDownloadPdf(invoiceData, openInNewTab);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF Generation failed";
      setFormError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSummary = getCurrentInvoiceData();

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate(false);
        }}
        className="space-y-6"
      >
        {/* Card 1: Header / Meta */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Bill of Supply Details</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Seller: ANASTOMOSIS ENTERPRISE LLP &bull; State Code: 24 (Gujarat)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFillSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Fill Sample (Reliance)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invoice No *</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="186-J/26-27"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invoice Date</span>
              </label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                placeholder="31/10/2026"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">DC No</label>
              <input
                type="text"
                value={dcNo}
                onChange={(e) => setDcNo(e.target.value)}
                placeholder="186-J/26-27"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">DC Date</label>
              <input
                type="text"
                value={dcDate}
                onChange={(e) => setDcDate(e.target.value)}
                placeholder="31/10/2026"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">PO No</label>
              <input
                type="text"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                placeholder="241128166"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Vehicle No</span>
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="MH41AU8917"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Place of Supply
              </label>
              <input
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                placeholder="GUJARAT"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Buyer GSTIN
              </label>
              <input
                type="text"
                value={buyerGstin}
                onChange={(e) => setBuyerGstin(e.target.value)}
                placeholder="24AALCR0464R1ZT"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Buyer PAN
              </label>
              <input
                type="text"
                value={buyerPan}
                onChange={(e) => setBuyerPan(e.target.value)}
                placeholder="AALCR0464R"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Vendor Code
              </label>
              <input
                type="text"
                value={vendorCode}
                onChange={(e) => setVendorCode(e.target.value)}
                placeholder="3778226"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
              />
            </div>
          </div>

          {/* Billed To & Shipped To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Billed To Card */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5 text-xs">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Billed To (Details of Receiver)</span>
              </div>

              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  value={billedToName}
                  onChange={(e) => setBilledToName(e.target.value)}
                  placeholder="M/S. Reliance New Solar Energy Limited"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Address & State
                </label>
                <textarea
                  rows={2}
                  value={billedToAddress}
                  onChange={(e) => setBilledToAddress(e.target.value)}
                  placeholder="Near Village Kana Chhikari, Lalpur, Jamnagar - 361006"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            {/* Shipped To Card (Editable!) */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/40 space-y-2.5 text-xs">
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
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Shipped To Entity Name
                </label>
                <input
                  type="text"
                  value={shippedToName}
                  onChange={(e) => setShippedToName(e.target.value)}
                  placeholder="Reliance New Solar Energy Limited"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Shipped To Full Address
                </label>
                <textarea
                  rows={2}
                  value={shippedToAddress}
                  onChange={(e) => setShippedToAddress(e.target.value)}
                  placeholder="Near Village Kana Chhikari, Lalpur, Jamnagar - 361006"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Line Items */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Line Items ({items.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-zinc-400 mt-2">#{idx + 1}</span>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Description of Goods
                      </label>
                      <input
                        type="text"
                        required
                        value={item.Item_Description || ""}
                        onChange={(e) => handleItemChange(idx, "Item_Description", e.target.value)}
                        placeholder="e.g. CORN STEEP LIQ_CBG"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                      />
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Bill Subtext:</span>
                        <span className="font-mono bg-zinc-200/70 dark:bg-zinc-700/70 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-semibold">
                          {item.Tax_Subtext || (item.HSN_Code ? `GST-${item.GST_Rate ?? 5}% (HSN ${item.HSN_Code})` : `GST-${item.GST_Rate ?? 5}%`)}
                        </span>
                      </div>
                    </div>

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

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={item.Unit || ""}
                        onChange={(e) => handleItemChange(idx, "Unit", e.target.value)}
                        placeholder="TON"
                        className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center uppercase"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Rate
                      </label>
                      <input
                        type="text"
                        value={item.Rate !== undefined ? String(item.Rate) : ""}
                        onChange={(e) => handleItemChange(idx, "Rate", e.target.value)}
                        placeholder="1190"
                        className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Taxable
                      </label>
                      <input
                        type="text"
                        value={item.Taxable_Amount !== undefined ? String(item.Taxable_Amount) : ""}
                        onChange={(e) => handleItemChange(idx, "Taxable_Amount", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-right font-bold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        GST %
                      </label>
                      <input
                        type="text"
                        value={item.GST_Rate !== undefined ? String(item.GST_Rate) : "5"}
                        onChange={(e) => handleItemChange(idx, "GST_Rate", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                        GST Amt *
                      </label>
                      <input
                        type="text"
                        value={item.GST_Amount !== undefined ? String(item.GST_Amount) : ""}
                        onChange={(e) => handleItemChange(idx, "GST_Amount", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-800 text-right font-medium text-emerald-700 dark:text-emerald-300"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Card 3: Tax Breakdown & Summary (Editable CGST, SGST, Round Off) */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Tax Breakdown & Total
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                CGST & SGST Amounts and Rates are editable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Taxable Subtotal
                </label>
                <div className="px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  ₹{Number(currentSummary.Total_Amount_Before_Tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-600 dark:text-zinc-400">CGST %</label>
                  <label className="font-medium text-emerald-600 dark:text-emerald-400">CGST Amt *</label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={cgstRate}
                    onChange={(e) => {
                      setCgstRate(e.target.value);
                      setIsTaxManual(true);
                    }}
                    placeholder="2.5%"
                    className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center font-medium"
                  />
                  <input
                    type="text"
                    value={cgstAmount}
                    onChange={(e) => {
                      setCgstAmount(e.target.value);
                      setIsTaxManual(true);
                    }}
                    placeholder="1010.01"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-900 font-mono text-right font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-zinc-600 dark:text-zinc-400">SGST %</label>
                  <label className="font-medium text-emerald-600 dark:text-emerald-400">SGST Amt *</label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={sgstRate}
                    onChange={(e) => {
                      setSgstRate(e.target.value);
                      setIsTaxManual(true);
                    }}
                    placeholder="2.5%"
                    className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-center font-medium"
                  />
                  <input
                    type="text"
                    value={sgstAmount}
                    onChange={(e) => {
                      setSgstAmount(e.target.value);
                      setIsTaxManual(true);
                    }}
                    placeholder="1010.01"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-900 font-mono text-right font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Round Off
                </label>
                <input
                  type="text"
                  value={roundOff}
                  onChange={(e) => setRoundOff(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-right font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Grand Total
                </label>
                <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 font-bold font-mono text-emerald-700 dark:text-emerald-300 text-right">
                  ₹{Number(currentSummary.Total_Amount_After_Tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
            {formError}
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setPreviewInvoice(getCurrentInvoiceData())}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Bill of Supply</span>
          </button>

          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <span>Open PDF</span>
          </button>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Generate & Download Bill of Supply</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Modal */}
      {previewInvoice && (
        <TaxInvoicePreviewModal
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onDownload={onDownloadPdf}
          onSave={handleSaveFromPreview}
        />
      )}
    </div>
  );
}
