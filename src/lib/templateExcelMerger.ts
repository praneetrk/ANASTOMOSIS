import * as XLSX from "xlsx";
import { InvoiceData, InvoiceItem } from "@/types/invoice";
import { TaxInvoiceData, TaxInvoiceItem } from "@/types/taxInvoice";
import { ExtractedPdfTemplate } from "@/lib/pdfParser";
import { formatDateIndian } from "@/lib/dateUtils";

export interface FieldConfig {
  key: string;
  label: string;
  category: "header" | "receiver" | "transport" | "item" | "tax";
  isConstant: boolean;
  value: string;
  description?: string;
}

export function getDefaultFieldConfigs(
  template: ExtractedPdfTemplate | null,
  docType: "challan" | "invoice"
): Record<string, FieldConfig> {
  const isChallan = docType === "challan";

  const defaultBuyerName = isChallan
    ? "M/S. Reliance Industries Limited"
    : "M/S. Reliance New Solar Energy Limited";

  const defaultBuyerAddress = isChallan
    ? "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
    : "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006";

  const defaultGstin = isChallan ? "24AAACR5055K1ZD" : "24AALCR0464R1ZT";
  const defaultPan = isChallan ? "AAACR5055K" : "AALCR0464R";

  return {
    // Header & Order
    Invoice_No: {
      key: "Invoice_No",
      label: "Invoice No.",
      category: "header",
      isConstant: false, // Variable by default
      value: template?.Invoice_No || "",
      description: "Document reference number",
    },
    Invoice_Date: {
      key: "Invoice_Date",
      label: "Invoice Date",
      category: "header",
      isConstant: false, // Variable by default
      value: template?.Invoice_Date || formatDateIndian(new Date()),
      description: "Date in DD/MM/YYYY format",
    },
    DC_No: {
      key: "DC_No",
      label: "DC / Challan No.",
      category: "header",
      isConstant: false,
      value: template?.DC_No || template?.Invoice_No || "",
      description: "Challan number (matches Invoice No if omitted)",
    },
    PO_No: {
      key: "PO_No",
      label: "PO Number",
      category: "header",
      isConstant: true, // Constant by default
      value: template?.PO_No || (isChallan ? "241128591" : "241128166"),
      description: "Purchase Order number",
    },
    Location: {
      key: "Location",
      label: "Location / Site",
      category: "header",
      isConstant: true,
      value: template?.Location || (isChallan ? "NAVSARI CBG" : "JAMNAGAR"),
      description: "Plant or delivery site code",
    },

    // Receiver (Billed To)
    Buyer_Name: {
      key: "Buyer_Name",
      label: "Billed To Name",
      category: "receiver",
      isConstant: true, // Constant by default
      value: template?.Buyer_Name || defaultBuyerName,
      description: "Company receiving the bill",
    },
    Buyer_Address: {
      key: "Buyer_Address",
      label: "Billed To Address",
      category: "receiver",
      isConstant: true, // Constant by default
      value: template?.Buyer_Address || defaultBuyerAddress,
      description: "Registered billing address",
    },
    Buyer_GSTIN: {
      key: "Buyer_GSTIN",
      label: "Buyer GST No.",
      category: "receiver",
      isConstant: true,
      value: template?.Buyer_GSTIN || defaultGstin,
      description: "GSTIN of recipient",
    },
    Buyer_PAN: {
      key: "Buyer_PAN",
      label: "Buyer PAN No.",
      category: "receiver",
      isConstant: true,
      value: template?.Buyer_PAN || defaultPan,
      description: "PAN of recipient",
    },
    Vendor_Code: {
      key: "Vendor_Code",
      label: "Vendor Code",
      category: "receiver",
      isConstant: true,
      value: template?.Vendor_Code || "3778226",
      description: "Reliance registered vendor code",
    },

    // Consignee (Shipped To)
    Shipped_To_Name: {
      key: "Shipped_To_Name",
      label: "Shipped To Name",
      category: "receiver",
      isConstant: true,
      value: template?.Shipped_To_Name || template?.Buyer_Name || defaultBuyerName,
      description: "Name of delivery destination",
    },
    Shipped_To_Address: {
      key: "Shipped_To_Address",
      label: "Shipped To Address",
      category: "receiver",
      isConstant: true,
      value: template?.Shipped_To_Address || template?.Buyer_Address || defaultBuyerAddress,
      description: "Physical delivery address",
    },

    // Transport & Vehicle
    Vehicle_No: {
      key: "Vehicle_No",
      label: "Vehicle Number",
      category: "transport",
      isConstant: false, // Variable by default
      value: template?.Vehicle_No || (isChallan ? "RJ09GE7594" : "MH41AU8917"),
      description: "Truck / vehicle registration plate",
    },

    // Item & Quantity
    Item_Description: {
      key: "Item_Description",
      label: "Item Description",
      category: "item",
      isConstant: true, // Constant by default
      value: template?.Item_Description || "MSW_CBG",
      description: "Name of goods",
    },
    HSN_Code: {
      key: "HSN_Code",
      label: "HSN Code",
      category: "item",
      isConstant: true,
      value: template?.HSN_Code || "3825 10 00",
      description: "HSN / SAC code",
    },
    Quantity: {
      key: "Quantity",
      label: "Quantity",
      category: "item",
      isConstant: false, // Variable by default
      value: template?.Quantity || "40.000",
      description: "Weight or quantity (e.g. 38.500)",
    },
    Unit: {
      key: "Unit",
      label: "Unit of Measure",
      category: "item",
      isConstant: true,
      value: template?.Unit || "TON",
      description: "TON / NOS / MT",
    },

    // Tax & Rate (for Bill of Supply)
    Rate: {
      key: "Rate",
      label: "Rate / Price",
      category: "tax",
      isConstant: true,
      value: template?.Rate || "2020.00",
      description: "Unit rate per measure",
    },
    GST_Rate: {
      key: "GST_Rate",
      label: "GST Rate (%)",
      category: "tax",
      isConstant: true,
      value: String(template?.GST_Rate ?? (isChallan ? 0 : 5)),
      description: "Tax rate (0%, 5%, etc.)",
    },
  };
}

// Generate Excel Template containing dynamic and/or constant columns based on configuration
export function generateDynamicExcelTemplate(
  configs: Record<string, FieldConfig>,
  docType: "challan" | "invoice",
  includeConstants = true
): Uint8Array {
  // Find all keys that are marked as NOT constant (dynamic from Excel)
  const dynamicKeys = Object.values(configs)
    .filter((c) => !c.isConstant)
    .map((c) => c.key);

  // Find all keys that are marked as constant
  const constantKeys = Object.values(configs)
    .filter((c) => c.isConstant)
    .map((c) => c.key);

  // If includeConstants is true, list editable columns first, followed by constant columns
  // If includeConstants is false, list only dynamic columns
  let orderedKeys: string[];
  if (includeConstants) {
    orderedKeys = [...dynamicKeys, ...constantKeys];
  } else {
    orderedKeys =
      dynamicKeys.length > 0
        ? dynamicKeys
        : ["Invoice_No", "Invoice_Date", "Vehicle_No", "Quantity"];
  }

  const sampleRows: Record<string, string | number>[] = [
    {},
    {},
    {},
  ];

  const sampleVehiclePlates = ["RJ09GE7594", "RJ09GE7595", "MH41AU8917"];
  const sampleQuantities = ["40.000", "38.500", "41.200"];
  const isChallan = docType === "challan";

  sampleRows.forEach((row, i) => {
    orderedKeys.forEach((k) => {
      const conf = configs[k];
      if (conf?.isConstant) {
        // Constant values are pre-filled so they show in Excel
        if (k === "Rate" || k === "GST_Rate") {
          row[k] = parseFloat(conf.value) || 0;
        } else {
          row[k] = conf.value || "";
        }
      } else {
        // Editable fields have sample values per row
        if (k === "Invoice_No" || k === "DC_No") {
          row[k] = isChallan ? `AE${134 + i}-N/26-27` : `${186 + i}-J/26-27`;
        } else if (k === "Invoice_Date" || k === "DC_Date") {
          row[k] = `27/10/2026`;
        } else if (k === "Vehicle_No") {
          row[k] = sampleVehiclePlates[i % sampleVehiclePlates.length];
        } else if (k === "Quantity") {
          row[k] = sampleQuantities[i % sampleQuantities.length];
        } else if (k === "Rate") {
          row[k] = 2020.0;
        } else {
          row[k] = conf?.value || "";
        }
      }
    });
  });

  const ws = XLSX.utils.json_to_sheet(sampleRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BatchData");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

// Merge an uploaded Excel file with the constant template values
export function mergeTemplateWithExcel(
  excelBuffer: ArrayBuffer | Uint8Array,
  configs: Record<string, FieldConfig>,
  docType: "challan" | "invoice"
): {
  challans: InvoiceData[];
  taxInvoices: TaxInvoiceData[];
  errors: string[];
} {
  const errors: string[] = [];
  const challans: InvoiceData[] = [];
  const taxInvoices: TaxInvoiceData[] = [];

  try {
    const rawData =
      excelBuffer instanceof Uint8Array
        ? excelBuffer
        : new Uint8Array(excelBuffer);

    const wb = XLSX.read(rawData, {
      type: "array",
      cellDates: true,
      dateNF: "dd/mm/yyyy",
    });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return { challans, taxInvoices, errors: ["Excel workbook has no sheets"] };
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      defval: "",
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    if (rawRows.length === 0) {
      return { challans, taxInvoices, errors: ["Excel sheet contains no data rows"] };
    }

    const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

    const getField = (row: Record<string, unknown>, aliases: string[]): string => {
      const rowKeys = Object.keys(row);
      for (const alias of aliases) {
        const normAlias = norm(alias);
        for (const k of rowKeys) {
          if (norm(k) === normAlias) {
            const v = row[k];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
              return String(v).trim();
            }
          }
        }
      }
      return "";
    };

    rawRows.forEach((row, idx) => {
      const getVal = (key: string, aliases: string[]): string => {
        const conf = configs[key];
        // If configured as constant, use template value!
        if (conf?.isConstant && conf.value.trim() !== "") {
          return conf.value.trim();
        }
        // Otherwise, extract from Excel row
        const excelVal = getField(row, [key, ...aliases]);
        if (excelVal) return excelVal;
        // Fallback to template value if not found in Excel
        return conf?.value || "";
      };

      const invoiceNo = getVal("Invoice_No", [
        "invoiceno",
        "invoicenumber",
        "billno",
        "challanno",
        "invno",
        "srno",
      ]) || `DOC-${idx + 1}`;

      const rawInvDate = getVal("Invoice_Date", ["invoicedate", "date", "invdate", "dt"]);
      const invoiceDate = formatDateIndian(rawInvDate) || formatDateIndian(new Date());

      const dcNo = getVal("DC_No", ["dcno", "challanno", "dcnumber"]) || invoiceNo;
      const rawDcDate = getVal("DC_Date", ["dcdate", "challandate"]);
      const dcDate = formatDateIndian(rawDcDate) || invoiceDate;

      const poNo = getVal("PO_No", ["pono", "ponumber", "purchaseorderno", "order"]);
      const vehicleNo = getVal("Vehicle_No", ["vehicleno", "vehiclenumber", "truckno", "lorryno"]);
      const location = getVal("Location", ["location", "site", "plant", "cbg"]) || "NAVSARI CBG";

      const buyerName = getVal("Buyer_Name", ["buyername", "billedto", "customername", "partyname"]);
      const buyerAddress = getVal("Buyer_Address", ["buyeraddress", "billedtoaddress", "address"]);
      const buyerGstin = getVal("Buyer_GSTIN", ["buyergstin", "gstin", "gstno", "gst"]);
      const buyerPan = getVal("Buyer_PAN", ["buyerpan", "panno", "pan"]);
      const vendorCode = getVal("Vendor_Code", ["vendorcode", "reliancevendorcode", "vendor"]);

      const shippedToName = getVal("Shipped_To_Name", ["shippedtoname", "shippedto", "consignee"]) || buyerName;
      const shippedToAddress = getVal("Shipped_To_Address", ["shippedtoaddress", "shippingaddress"]) || buyerAddress;

      const itemDesc = getVal("Item_Description", ["itemdescription", "description", "itemname", "item"]) || "MSW_CBG";
      const hsnCode = getVal("HSN_Code", ["hsncode", "hsn", "sac"]) || "3825 10 00";
      const quantity = getVal("Quantity", ["quantity", "qty", "totalqty"]) || "0.000";
      const unit = getVal("Unit", ["unit", "uom"]) || "TON";

      const rateStr = getVal("Rate", ["rate", "price", "unitrate"]) || "0";
      const rateNum = parseFloat(rateStr.replace(/,/g, "")) || 0;
      const qtyNum = parseFloat(quantity.replace(/,/g, "")) || 0;

      const gstRateStr = getVal("GST_Rate", ["gstrate", "taxrate", "gst"]) || "0";
      const gstRateNum = parseFloat(gstRateStr.replace(/[^0-9.]/g, "")) || 0;

      if (docType === "challan") {
        const item: InvoiceItem = {
          Item_Description: itemDesc,
          HSN_Code: hsnCode,
          Quantity: quantity,
          Unit: unit,
          Tax_Subtext: hsnCode ? `GST-${gstRateNum}% (HSN ${hsnCode})` : `GST-${gstRateNum}%`,
        };

        const challanDoc: InvoiceData = {
          Invoice_No: invoiceNo,
          Invoice_Date: invoiceDate,
          DC_No: dcNo,
          DC_Date: dcDate,
          PO_No: poNo,
          Vehicle_No: vehicleNo,
          Location: location,
          Buyer_Name: buyerName,
          Buyer_Address: buyerAddress,
          Shipped_To_Name: shippedToName,
          Shipped_To_Address: shippedToAddress,
          Buyer_GSTIN: buyerGstin,
          Buyer_PAN: buyerPan,
          Vendor_Code: vendorCode,
          items: [item],
        };
        challans.push(challanDoc);
      } else {
        // Bill of Supply (Invoice)
        const taxableAmount = Number((qtyNum * rateNum).toFixed(2));
        const gstAmount = Number(((taxableAmount * gstRateNum) / 100).toFixed(2));
        const totalAmount = Number((taxableAmount + gstAmount).toFixed(2));

        const isIntraState = true; // Gujarat
        const halfGstRate = (gstRateNum / 2).toFixed(1) + "%";
        const halfGstAmt = Number((gstAmount / 2).toFixed(2));

        const taxItem: TaxInvoiceItem = {
          Sr: 1,
          Item_Description: itemDesc,
          HSN_Code: hsnCode,
          Quantity: quantity,
          Unit: unit,
          Rate: rateNum,
          Taxable_Amount: taxableAmount,
          GST_Rate: gstRateNum,
          GST_Amount: gstAmount,
          Total_Amount: totalAmount,
          Tax_Subtext: hsnCode ? `GST-${gstRateNum}% (HSN ${hsnCode})` : `GST-${gstRateNum}%`,
        };

        const invoiceDoc: TaxInvoiceData = {
          docType: "invoice",
          Invoice_No: invoiceNo,
          Invoice_Date: invoiceDate,
          DC_No: dcNo,
          DC_Date: dcDate,
          PO_No: poNo,
          Vehicle_No: vehicleNo,
          Billed_To_Name: buyerName,
          Billed_To_Address: buyerAddress,
          Billed_To_State: "Gujarat, India",
          Billed_To_State_Code: "24",
          Shipped_To_Name: shippedToName,
          Shipped_To_Address: shippedToAddress,
          Shipped_To_State: "Gujarat, India",
          Shipped_To_State_Code: "24",
          Buyer_GSTIN: buyerGstin,
          Buyer_PAN: buyerPan,
          Vendor_Code: vendorCode,
          Place_Of_Supply: location || "GUJARAT",
          Total_Amount_Before_Tax: taxableAmount,
          CGST_Rate: isIntraState ? halfGstRate : "0%",
          CGST_Amount: isIntraState ? halfGstAmt : 0,
          SGST_Rate: isIntraState ? halfGstRate : "0%",
          SGST_Amount: isIntraState ? halfGstAmt : 0,
          Total_Tax_Amount: gstAmount,
          Total_Amount_After_Tax: totalAmount,
          items: [taxItem],
        };
        taxInvoices.push(invoiceDoc);
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error parsing Excel file";
    errors.push(msg);
  }

  return { challans, taxInvoices, errors };
}
