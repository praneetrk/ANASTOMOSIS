import * as XLSX from "xlsx";
import { InvoiceData, InvoiceItem, ParsedExcelRow } from "@/types/invoice";
import { formatDateIndian } from "@/lib/dateUtils";

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

export function parseAndGroupExcel(dataBuffer: ArrayBuffer): {
  invoices: InvoiceData[];
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
    // defval: "" guarantees empty cells become empty string ""
    const rawRows = XLSX.utils.sheet_to_json<ParsedExcelRow>(worksheet, {
      defval: "",
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    if (rawRows.length === 0) {
      return { invoices: [], errors: ["The sheet is empty or contains no data rows."] };
    }

    const groupedMap = new Map<string, InvoiceData>();
    let blankInvoiceCounter = 1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i] as Record<string, unknown>;

      let invoiceNo = getField(row, [
        "invoiceno",
        "invoicenumber",
        "invoicenum",
        "invno",
        "invnumber",
        "billno",
        "billnumber",
      ]);

      // If Invoice_No is missing in row, assign a placeholder or warn
      if (!invoiceNo) {
        invoiceNo = `UNSPECIFIED-${blankInvoiceCounter++}`;
        errors.push(`Row ${i + 2}: Missing Invoice_No. Assigned temporary ID: ${invoiceNo}`);
      }

      const invoiceDate = formatDateIndian(
        getField(row, [
          "invoicedate",
          "invdate",
          "date",
          "billdate",
          "invdt",
        ])
      );

      const dcNo = getField(row, [
        "dcno",
        "dcnumber",
        "challanno",
        "challannumber",
        "deliverychallanno",
        "deliverychallan",
        "challan",
        "dc",
      ]);

      const dcDate = formatDateIndian(
        getField(row, [
          "dcdate",
          "challandate",
          "deliverychallandate",
          "dcdt",
        ])
      );

      const poNo = getField(row, [
        "pono",
        "ponumber",
        "purchaseorderno",
        "orderno",
        "po",
        "purchaseorder",
        "ordernumber",
      ]);

      const vehicleNo = getField(row, [
        "vehicleno",
        "vehiclenumber",
        "truckno",
        "lorryno",
        "vehicle",
        "transportno",
      ]);

      const location = getField(row, [
        "location",
        "sublocation",
        "site",
        "plant",
        "cbg",
      ]) || "NAVSARI CBG";

      const buyerName = getField(row, [
        "buyername",
        "billedto",
        "billedtoname",
        "partyname",
        "customername",
        "buyer",
      ]);
      const buyerAddress = getField(row, [
        "buyeraddress",
        "billedtoaddress",
        "billingaddress",
        "address",
        "partyaddress",
      ]);
      const shippedToName = getField(row, [
        "shippedtoname",
        "shippedto",
        "consigneename",
        "consignee",
        "shipname",
        "deliveryparty",
      ]);
      const shippedToAddress = getField(row, [
        "shippedtoaddress",
        "shippingaddress",
        "consigneeaddress",
        "deliveryaddress",
        "siteaddress",
      ]);
      const buyerGstin = getField(row, [
        "buyergstin",
        "gstin",
        "gstno",
        "gst",
        "receivergst",
        "buyergst",
        "partygst",
      ]);
      const buyerPan = getField(row, [
        "buyerpan",
        "panno",
        "pan",
        "receiverpan",
        "partypan",
      ]);
      const vendorCode = getField(row, [
        "vendorcode",
        "vendor",
        "reliancevendorcode",
      ]);

      const itemDesc = getField(row, [
        "itemdescription",
        "description",
        "discription", // Support common spelling variation
        "itemdiscription",
        "itemdesc",
        "desc",
        "itemname",
        "particulars",
        "materialdescription",
        "materialdesc",
        "productdescription",
        "productname",
        "product",
        "items",
        "item",
        "details",
        "specification",
        "specs",
      ]);

      const hsnCode = getField(row, [
        "hsncode",
        "hsn",
        "sac",
        "hsnsac",
      ]);

      const quantity = getField(row, [
        "quantity",
        "qty",
        "totalqty",
      ]);

      const unit = getField(row, [
        "unit",
        "uom",
        "units",
      ]) || "TON";

      const item: InvoiceItem = {
        Item_Description: itemDesc,
        HSN_Code: hsnCode,
        Quantity: quantity,
        Unit: unit,
        Tax_Subtext: hsnCode ? `GST-0% (HSN ${hsnCode})` : "GST-0%",
      };

      if (!groupedMap.has(invoiceNo)) {
        groupedMap.set(invoiceNo, {
          Invoice_No: invoiceNo,
          Invoice_Date: invoiceDate,
          DC_No: dcNo || invoiceNo,
          DC_Date: dcDate || invoiceDate,
          PO_No: poNo || "241128591",
          Vehicle_No: vehicleNo || "RJ09GE7594",
          Location: location,
          Buyer_Name: buyerName || "M/S. Reliance Industries Limited",
          Buyer_Address:
            buyerAddress ||
            "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
          Shipped_To_Name:
            shippedToName || buyerName || "M/S. Reliance Industries Limited",
          Shipped_To_Address:
            shippedToAddress ||
            buyerAddress ||
            "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433",
          Buyer_GSTIN: buyerGstin || "24AAACR5055K1ZD",
          Buyer_PAN: buyerPan || "AAACR5055K",
          Vendor_Code: vendorCode || "3778226",
          items: [item],
        });
      } else {
        const existing = groupedMap.get(invoiceNo)!;
        // Merge headers if empty in previous rows
        if (!existing.Invoice_Date && invoiceDate) existing.Invoice_Date = invoiceDate;
        if (!existing.DC_No && dcNo) existing.DC_No = dcNo;
        if (!existing.DC_Date && dcDate) existing.DC_Date = dcDate;
        if (!existing.PO_No && poNo) existing.PO_No = poNo;
        if (!existing.Vehicle_No && vehicleNo) existing.Vehicle_No = vehicleNo;
        if (location && existing.Location === "NAVSARI CBG") existing.Location = location;
        if (buyerName) existing.Buyer_Name = buyerName;
        if (buyerAddress) existing.Buyer_Address = buyerAddress;
        if (shippedToName) existing.Shipped_To_Name = shippedToName;
        if (shippedToAddress) existing.Shipped_To_Address = shippedToAddress;
        if (buyerGstin) existing.Buyer_GSTIN = buyerGstin;
        if (buyerPan) existing.Buyer_PAN = buyerPan;
        if (vendorCode) existing.Vendor_Code = vendorCode;

        // Append item
        existing.items.push(item);
      }
    }

    const invoices = Array.from(groupedMap.values());
    return { invoices, errors };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to parse Excel file";
    return { invoices: [], errors: [msg] };
  }
}
