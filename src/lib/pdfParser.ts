import { formatDateIndian } from "@/lib/dateUtils";

export interface ExtractedPdfTemplate {
  docType: "challan" | "invoice";
  rawText: string;

  // Header & Identifiers
  Invoice_No?: string;
  Invoice_Date?: string;
  DC_No?: string;
  DC_Date?: string;
  PO_No?: string;
  Vehicle_No?: string;
  Location?: string;

  // Billed To
  Buyer_Name?: string;
  Buyer_Address?: string;
  Buyer_GSTIN?: string;
  Buyer_PAN?: string;
  Vendor_Code?: string;
  Place_Of_Supply?: string;

  // Shipped To
  Shipped_To_Name?: string;
  Shipped_To_Address?: string;

  // Primary Item
  Item_Description?: string;
  HSN_Code?: string;
  Quantity?: string;
  Unit?: string;
  Rate?: string;
  GST_Rate?: number;
  Tax_Subtext?: string;
}

export function parsePdfText(rawText: string): ExtractedPdfTemplate {
  const text = rawText || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const isBillOfSupply =
    /bill\s*of\s*supply/i.test(text) ||
    /tax\s*invoice/i.test(text) ||
    /rate/i.test(text) && /taxable\s*value/i.test(text);

  const docType: "challan" | "invoice" = isBillOfSupply ? "invoice" : "challan";

  // GSTIN regex (Standard 15-char Indian GSTIN)
  const gstinMatches = text.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b/gi) || [];
  // Find customer GSTIN (exclude Anastomosis: 24ABWFA7922J1ZY)
  const customerGstin = gstinMatches.find((g) => !g.toUpperCase().includes("24ABWFA7922J1ZY")) || gstinMatches[0] || "";

  // PAN regex (10-char Indian PAN)
  const panMatches = text.match(/\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi) || [];
  // Exclude Anastomosis PAN (ABWFA7922J)
  const customerPan = panMatches.find((p) => !p.toUpperCase().includes("ABWFA7922J")) || panMatches[0] || "";

  // Vendor Code
  const vendorMatch = text.match(/(?:vendor\s*code|reliance\s*vendor\s*code)\s*[:.-]?\s*([A-Z0-9]+)/i);
  const vendorCode = vendorMatch ? vendorMatch[1].trim() : "";

  // PO Number
  const poMatch = text.match(/(?:po\s*no\.?|purchase\s*order\s*no\.?|po\s*number)\s*[:.-]?\s*([A-Z0-9\-_/]+)/i);
  const poNo = poMatch ? poMatch[1].trim() : "";

  // Vehicle Number (e.g. RJ09GE7594, MH41AU8917, GJ01AB1234)
  const plateMatch = text.match(/\b([A-Z]{2}\s*[-]?\s*[0-9]{1,2}\s*[-]?\s*[A-Z]{1,3}\s*[-]?\s*[0-9]{4})\b/i);
  let vehicleNo = "";
  if (plateMatch) {
    vehicleNo = plateMatch[1].replace(/\s+/g, "").toUpperCase();
  } else {
    const lineVehicleMatch = text.match(/(?:vehicle\s*no\.?|truck\s*no\.?|lorry\s*no\.?|transport\s*no\.?)\s*[:.-]?\s*([^\n\r,]+)/i);
    if (lineVehicleMatch) {
      vehicleNo = lineVehicleMatch[1].replace(/^(Transport,?\s*)?(Vehicle\s*No\.?\s*:?\s*)?/i, "").trim();
    }
  }

  // Invoice No & Date
  const invNoMatch = text.match(/(?:invoice\s*no\.?|bill\s*no\.?|inv\s*no\.?)\s*[:.-]?\s*([A-Z0-9\-_/]+)/i);
  const invoiceNo = invNoMatch ? invNoMatch[1].trim() : "";

  const dcNoMatch = text.match(/(?:dc\s*no\.?|challan\s*no\.?)\s*[:.-]?\s*([A-Z0-9\-_/]+)/i);
  const dcNo = dcNoMatch ? dcNoMatch[1].trim() : invoiceNo;

  // Dates (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD)
  const dateMatches = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || [];
  const invoiceDate = dateMatches.length > 0 ? formatDateIndian(dateMatches[0]) : "";
  const dcDate = dateMatches.length > 1 ? formatDateIndian(dateMatches[1]) : invoiceDate;

  // Location / Place of Supply
  let location = "";
  if (/navsari/i.test(text)) location = "NAVSARI CBG";
  else if (/jamnagar/i.test(text)) location = "JAMNAGAR";
  else if (/hazira/i.test(text)) location = "HAZIRA";
  else if (/dahej/i.test(text)) location = "DAHEJ";

  // Buyer Name & Address Extraction
  let buyerName = "";
  let buyerAddress = "";

  // Check for Reliance or other prominent names
  if (/reliance\s*new\s*solar\s*energy\s*limited/i.test(text)) {
    buyerName = "M/S. Reliance New Solar Energy Limited";
    buyerAddress = "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006";
  } else if (/reliance\s*industries\s*limited/i.test(text)) {
    buyerName = "M/S. Reliance Industries Limited";
    buyerAddress = "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433";
  } else {
    // Attempt line-by-line extraction after "Details of Receiver(Billed to):" or "Billed to:"
    const billedToIndex = lines.findIndex((l) => /details\s*of\s*receiver|billed\s*to/i.test(l));
    if (billedToIndex !== -1 && billedToIndex + 1 < lines.length) {
      buyerName = lines[billedToIndex + 1];
      if (billedToIndex + 2 < lines.length && !/invoice\s*no|gst\s*no|date/i.test(lines[billedToIndex + 2])) {
        buyerAddress = lines[billedToIndex + 2];
      }
    }
  }

  // Shipped To (consignee)
  let shippedToName = buyerName;
  let shippedToAddress = buyerAddress;
  const shippedToIndex = lines.findIndex((l) => /shipped\s*to|consignee/i.test(l));
  if (shippedToIndex !== -1 && shippedToIndex + 1 < lines.length) {
    const candidateName = lines[shippedToIndex + 1];
    if (!/invoice\s*no|dc\s*no|date/i.test(candidateName)) {
      shippedToName = candidateName;
      if (shippedToIndex + 2 < lines.length && !/gst\s*no|date|vehicle/i.test(lines[shippedToIndex + 2])) {
        shippedToAddress = lines[shippedToIndex + 2];
      }
    }
  }

  // Item extraction
  let itemDesc = "MSW_CBG";
  if (/cbg\s*slurry/i.test(text)) itemDesc = "CBG SLURRY";
  else if (/msw_cbg/i.test(text)) itemDesc = "MSW_CBG";
  else if (/cbg/i.test(text)) itemDesc = "CBG";

  // HSN Code
  const hsnMatch = text.match(/\b(?:hsn(?:\s*code)?|sac)\s*[:.-]?\s*([0-9\s]{6,10})\b/i) || text.match(/\b(3825\s*10\s*00|2303\s*10\s*00|2711\s*19\s*00)\b/);
  const hsnCode = hsnMatch ? hsnMatch[1].trim() : "3825 10 00";

  // Quantity
  const qtyMatch = text.match(/\b(\d{1,4}(?:\.\d{1,3})?)\s*(?:TON|MT|NOS|KGS?)\b/i) || text.match(/\b(?:qty|quantity)\s*[:.-]?\s*(\d{1,4}(?:\.\d{1,3})?)\b/i);
  const quantity = qtyMatch ? qtyMatch[1].trim() : "";

  // Unit
  const unitMatch = text.match(/\b(TON|MT|NOS|KG|KGS|LITRES?)\b/i);
  const unit = unitMatch ? unitMatch[1].toUpperCase() : "TON";

  // Rate & GST Rate
  let rate = "";
  const rateMatch = text.match(/(?:rate|price)\s*[:.-]?\s*([0-9,]+(?:\.\d{1,2})?)/i);
  if (rateMatch) rate = rateMatch[1].replace(/,/g, "");

  let gstRate = 0;
  if (/gst-?5%/i.test(text) || /5%/i.test(text)) gstRate = 5;
  else if (/gst-?18%/i.test(text) || /18%/i.test(text)) gstRate = 18;
  else if (/gst-?0%/i.test(text) || /0%/i.test(text)) gstRate = 0;

  return {
    docType,
    rawText: text,
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
    Buyer_GSTIN: customerGstin,
    Buyer_PAN: customerPan,
    Vendor_Code: vendorCode,
    Place_Of_Supply: location || "GUJARAT",
    Item_Description: itemDesc,
    HSN_Code: hsnCode,
    Quantity: quantity,
    Unit: unit,
    Rate: rate,
    GST_Rate: gstRate,
    Tax_Subtext: hsnCode ? `GST-${gstRate}% (HSN ${hsnCode})` : `GST-${gstRate}%`,
  };
}
