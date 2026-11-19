import * as XLSX from "xlsx";
import { TaxInvoiceData, TaxInvoiceItem } from "@/types/taxInvoice";
import { numberToWordsIndian } from "./numberToWords";
import { formatDateIndian } from "./dateUtils";

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getField(row: Record<string, unknown>, targetKeys: string[]): string {
  for (const [key, value] of Object.entries(row)) {
    const norm = normalizeKey(key);
    for (const target of targetKeys) {
      if (norm === target) {
        if (value === undefined || value === null) return "";
        const str = String(value).trim();
        return str === "undefined" || str === "null" ? "" : str;
      }
    }
  }
  return "";
}

function getNumericField(
  row: Record<string, unknown>,
  targetKeys: string[]
): number | undefined {
  const str = getField(row, targetKeys);
  if (!str) return undefined;
  const num = parseFloat(str.replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
}

export function parseAndGroupTaxInvoiceExcel(dataBuffer: ArrayBuffer): {
  invoices: TaxInvoiceData[];
  errors: string[];
} {
  const errors: string[] = [];
  try {
    const workbook = XLSX.read(dataBuffer, {
      type: "array",
      cellDates: true,
      dateNF: "dd/mm/yyyy",
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return { invoices: [], errors: ["The uploaded file contains no sheets."] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    if (rawRows.length === 0) {
      return { invoices: [], errors: ["The sheet is empty or contains no data rows."] };
    }

    const groupedMap = new Map<string, TaxInvoiceData>();
    let blankCounter = 1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      let invoiceNo = getField(row, [
        "invoiceno",
        "invoicenumber",
        "invoicenum",
        "invno",
        "invnumber",
        "billno",
        "billnumber",
      ]);

      if (!invoiceNo) {
        invoiceNo = `TAX-INV-${blankCounter++}`;
        errors.push(`Row ${i + 2}: Missing Invoice_No. Assigned temporary ID: ${invoiceNo}`);
      }

      const invoiceDate = formatDateIndian(getField(row, ["invoicedate", "invdate", "date", "billdate"]));
      const dcNo = getField(row, ["dcno", "dcnumber", "challanno", "deliverychallanno", "challan"]);
      const dcDate = formatDateIndian(getField(row, ["dcdate", "challandate", "deliverychallandate"]));
      const poNo = getField(row, ["pono", "ponumber", "purchaseorderno", "orderno", "po"]);
      const vehicleNo = getField(row, ["vehicleno", "vehiclenumber", "truckno", "lorryno", "transportno"]);

      // Receiver info
      const billedToName = getField(row, ["billedtoname", "billedto", "buyername", "partyname"]);
      const billedToAddress = getField(row, ["billedtoaddress", "buyeraddress", "partyaddress", "address"]);
      const shippedToName = getField(row, [
        "shippedtoname",
        "shippedto",
        "consigneename",
        "consignee",
        "shipto",
        "shiptoname",
      ]);
      const shippedToAddress = getField(row, [
        "shippedtoaddress",
        "consigneeaddress",
        "shiptoaddress",
        "shippedaddress",
      ]);
      const buyerGstin = getField(row, ["buyergstin", "buyergst", "gstin", "gstno"]);
      const buyerPan = getField(row, ["buyerpan", "panno", "pan"]);
      const vendorCode = getField(row, ["vendorcode", "reliancevendorcode", "vendorid"]);
      const placeOfSupply = getField(row, ["placeofsupply", "pos", "state"]);

      // Direct Tax Overrides from Excel if specified
      const explicitCgstAmt = getNumericField(row, ["cgstamount", "cgstamt", "cgst"]);
      const explicitSgstAmt = getNumericField(row, ["sgstamount", "sgstamt", "sgst"]);
      const explicitCgstRate = getField(row, ["cgstrate", "cgstpercent", "cgstpercentage"]);
      const explicitSgstRate = getField(row, ["sgstrate", "sgstpercent", "sgstpercentage"]);

      // Item Fields
      const itemDesc = getField(row, [
        "itemdescription",
        "description",
        "discription",
        "itemdiscription",
        "desc",
        "itemdesc",
        "itemname",
        "particulars",
        "materialdescription",
      ]);

      const hsnCode = getField(row, ["hsncode", "hsn", "sac", "hsnsac"]);
      const quantity = getNumericField(row, ["quantity", "qty", "totalqty", "count"]) ?? getField(row, ["quantity", "qty"]);
      const unit = getField(row, ["unit", "uom", "units"]) || "NOS";

      const rate = getNumericField(row, ["rate", "price", "unitprice", "unitrate"]) ?? 0;

      // Taxable amount: read directly from Excel if given, else calculate Qty * Rate
      let taxableAmount = getNumericField(row, ["taxableamount", "taxable", "basicamount"]);
      const qtyNum = typeof quantity === "number" ? quantity : parseFloat(String(quantity || 0));
      if (taxableAmount === undefined && !isNaN(qtyNum) && rate > 0) {
        taxableAmount = qtyNum * rate;
      }

      // GST Rate
      let gstRate = getNumericField(row, ["gstrate", "gstpercentage", "gstpercent", "taxrate"]);
      if (gstRate === undefined) {
        gstRate = 5; // default 5%
      }

      // GST Amount: read directly from Excel if given, else calculate from Taxable * Rate
      let gstAmount = getNumericField(row, ["gstamount", "taxamount", "gst"]);
      if (gstAmount === undefined && taxableAmount !== undefined) {
        gstAmount = (taxableAmount * gstRate) / 100;
      }

      // Total Amount
      let totalAmount = getNumericField(row, ["totalamount", "total", "netamount"]);
      if (totalAmount === undefined && taxableAmount !== undefined) {
        totalAmount = taxableAmount + (gstAmount || 0);
      }

      const item: TaxInvoiceItem = {
        Sr: 0, // will be assigned after grouping
        Item_Description: itemDesc,
        HSN_Code: hsnCode,
        Quantity: quantity,
        Unit: unit,
        Rate: rate,
        Taxable_Amount: taxableAmount,
        GST_Rate: gstRate,
        GST_Amount: gstAmount,
        Total_Amount: totalAmount,
        Tax_Subtext: hsnCode ? `GST-${gstRate}% (HSN ${hsnCode})` : `GST-${gstRate}%`,
      };

      if (!groupedMap.has(invoiceNo)) {
        groupedMap.set(invoiceNo, {
          docType: "invoice",
          Invoice_No: invoiceNo,
          Invoice_Date: invoiceDate,
          DC_No: dcNo || invoiceNo,
          DC_Date: dcDate || invoiceDate,
          PO_No: poNo,
          Vehicle_No: vehicleNo,
          Billed_To_Name: billedToName || "M/S. Reliance New Solar Energy Limited",
          Billed_To_Address:
            billedToAddress ||
            "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
          Billed_To_State: "Gujarat, India",
          Billed_To_State_Code: "24",
          Shipped_To_Name:
            shippedToName ||
            billedToName ||
            "Reliance New Solar Energy Limited",
          Shipped_To_Address:
            shippedToAddress ||
            billedToAddress ||
            "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006",
          Shipped_To_State: "Gujarat, India",
          Shipped_To_State_Code: "24",
          Buyer_GSTIN: buyerGstin || "24AALCR0464R1ZT",
          Buyer_PAN: buyerPan || "AALCR0464R",
          Vendor_Code: vendorCode || "3778226",
          Place_Of_Supply: placeOfSupply || "GUJARAT",
          CGST_Rate: explicitCgstRate || "2.5%",
          CGST_Amount: explicitCgstAmt !== undefined ? explicitCgstAmt : undefined,
          SGST_Rate: explicitSgstRate || "2.5%",
          SGST_Amount: explicitSgstAmt !== undefined ? explicitSgstAmt : undefined,
          items: [item],
        });
      } else {
        const existing = groupedMap.get(invoiceNo)!;
        if (!existing.Invoice_Date && invoiceDate) existing.Invoice_Date = invoiceDate;
        if (!existing.DC_No && dcNo) existing.DC_No = dcNo;
        if (!existing.DC_Date && dcDate) existing.DC_Date = dcDate;
        if (!existing.PO_No && poNo) existing.PO_No = poNo;
        if (!existing.Vehicle_No && vehicleNo) existing.Vehicle_No = vehicleNo;
        if (billedToName && existing.Billed_To_Name === "M/S. Reliance New Solar Energy Limited") existing.Billed_To_Name = billedToName;
        if (billedToAddress && existing.Billed_To_Address?.includes("Kana Chhikari")) existing.Billed_To_Address = billedToAddress;
        if (shippedToName) existing.Shipped_To_Name = shippedToName;
        if (shippedToAddress) existing.Shipped_To_Address = shippedToAddress;
        if (buyerGstin) existing.Buyer_GSTIN = buyerGstin;
        if (vendorCode) existing.Vendor_Code = vendorCode;
        if (placeOfSupply) existing.Place_Of_Supply = placeOfSupply;
        if (explicitCgstAmt !== undefined) existing.CGST_Amount = explicitCgstAmt;
        if (explicitSgstAmt !== undefined) existing.SGST_Amount = explicitSgstAmt;
        if (explicitCgstRate) existing.CGST_Rate = explicitCgstRate;
        if (explicitSgstRate) existing.SGST_Rate = explicitSgstRate;

        existing.items.push(item);
      }
    }

    // Post-process grouped invoices: assign row numbers, calculate totals and tax breakdown
    const invoices = Array.from(groupedMap.values()).map((inv) => {
      let subtotalTaxable = 0;
      let subtotalGst = 0;

      inv.items.forEach((it, idx) => {
        it.Sr = idx + 1;
        const taxVal = typeof it.Taxable_Amount === "number" ? it.Taxable_Amount : parseFloat(String(it.Taxable_Amount || 0));
        const gstVal = typeof it.GST_Amount === "number" ? it.GST_Amount : parseFloat(String(it.GST_Amount || 0));
        subtotalTaxable += isNaN(taxVal) ? 0 : taxVal;
        subtotalGst += isNaN(gstVal) ? 0 : gstVal;
      });

      const isIntraState =
        inv.Billed_To_State_Code === "24" ||
        inv.Place_Of_Supply?.toUpperCase().includes("GUJARAT") ||
        !inv.Place_Of_Supply;

      const fallbackCgst = subtotalGst / 2;
      const fallbackSgst = subtotalGst / 2;

      const finalCgst =
        inv.CGST_Amount !== undefined && inv.CGST_Amount !== null
          ? Number(inv.CGST_Amount)
          : Number(fallbackCgst.toFixed(2));

      const finalSgst =
        inv.SGST_Amount !== undefined && inv.SGST_Amount !== null
          ? Number(inv.SGST_Amount)
          : Number(fallbackSgst.toFixed(2));

      inv.Total_Amount_Before_Tax = Number(subtotalTaxable.toFixed(2));
      if (isIntraState) {
        if (!inv.CGST_Rate) inv.CGST_Rate = subtotalGst === 0 ? "0%" : "2.5%";
        inv.CGST_Amount = finalCgst;
        if (!inv.SGST_Rate) inv.SGST_Rate = subtotalGst === 0 ? "0%" : "2.5%";
        inv.SGST_Amount = finalSgst;
      } else {
        inv.IGST_Rate = subtotalGst === 0 ? "0%" : "5%";
        inv.IGST_Amount = Number(subtotalGst.toFixed(2));
      }

      inv.Round_Off = 0.0;
      const totalAmount = isIntraState
        ? subtotalTaxable + finalCgst + finalSgst
        : subtotalTaxable + subtotalGst;

      inv.Total_Amount_After_Tax = Number(totalAmount.toFixed(2));
      inv.Amount_In_Words = numberToWordsIndian(inv.Total_Amount_After_Tax);

      return inv;
    });

    return { invoices, errors };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse Bill of Supply Excel file";
    return { invoices: [], errors: [msg] };
  }
}

