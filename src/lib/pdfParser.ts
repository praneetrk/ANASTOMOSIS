import { formatDateIndian } from "@/lib/dateUtils";

export interface ExtractedPdfTemplate {
  docType: "challan" | "invoice";
  rawText: string;

  // Company Header
  Company_Name?: string;
  Company_Address?: string;
  Company_GSTIN?: string;

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

  // Footer & Signatory
  Terms_Conditions?: string;
  Signatory_Company_Text?: string;
  Signatory_Label?: string;

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

  // Company Name, Address, GSTIN
  let companyName = "ANASTOMOSIS ENTERPRISE LLP";
  let companyAddress = "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India";
  const compAddrMatch = text.match(/ANASTOMOSIS\s*ENTERPRISE\s*LLP\s*\n\s*([^\n]+(?:\n[^\n]+)?)\s*\n\s*GST\s*No/i);
  if (compAddrMatch) {
    const rawAddr = compAddrMatch[1].replace(/\n/g, ", ").trim();
    if (rawAddr.length > 5) {
      companyAddress = rawAddr;
    }
  }
  const companyGstin = "24ABWFA7922J1ZY";

  // Buyer Name & Address Extraction (Dynamic, without hardcoded overrides)
  let buyerName = "";
  let buyerAddress = "";

  const billedBlockMatch = text.match(
    /(?:Details of Receiver\(Billed to\):|Details of Receiver\s*\(Billed to\)|Billed to:)\s*([\s\S]*?)(?:Invoice No|DC No|GST NO|PAN NO|Reliance Vendor Code|Transport|Dispatched|$)/i
  );

  if (billedBlockMatch) {
    let block = billedBlockMatch[1].trim();
    block = block.replace(/^Billed To:\s*/i, "");

    const splitMatch =
      block.match(/^(M\/S\.?\s*[A-Za-z0-9\s.,&'-]+?(?:Limited|Ltd|LLP|PVT|Corporation|Inc))\s*(?:,\s*)?([\s\S]*)$/i) ||
      block.match(/^(M\/S\.?\s*Reliance Industries Limited)\s*(?:,\s*)?([\s\S]*)$/i) ||
      block.match(/^(M\/S\.?\s*Reliance New Solar Energy Limited)\s*(?:,\s*)?([\s\S]*)$/i);

    if (splitMatch) {
      buyerName = splitMatch[1].trim();
      buyerAddress = splitMatch[2].replace(/\n+/g, ", ").trim();
    } else {
      const blockLines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (blockLines.length > 0) buyerName = blockLines[0];
      if (blockLines.length > 1) buyerAddress = blockLines.slice(1).join(", ");
    }
  }

  // Fallbacks only if completely empty
  if (!buyerName) {
    if (/reliance\s*new\s*solar/i.test(text)) {
      buyerName = "M/S. Reliance New Solar Energy Limited";
    } else {
      buyerName = "M/S. Reliance Industries Limited";
    }
  }

  if (!buyerAddress) {
    if (/kana\s*chhikari|jamnagar/i.test(text)) {
      buyerAddress = "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006";
    } else if (/khadsupa|navsari/i.test(text)) {
      buyerAddress = "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433";
    }
  }

  // Shipped To (consignee)
  let shippedToName = buyerName;
  let shippedToAddress = buyerAddress;

  const shippedBlockMatch = text.match(
    /(?:Shipped To:|Consignee:)\s*([\s\S]*?)(?:DC No|Invoice No|Date|GST NO|PAN NO|Reliance Vendor Code|Transport|Dispatched|$)/i
  );

  if (shippedBlockMatch) {
    let sBlock = shippedBlockMatch[1].trim();
    sBlock = sBlock.replace(/^Shipped To:\s*/i, "");
    const sSplitMatch =
      sBlock.match(/^(M\/S\.?\s*[A-Za-z0-9\s.,&'-]+?(?:Limited|Ltd|LLP|PVT|Corporation|Inc))\s*(?:,\s*)?([\s\S]*)$/i) ||
      sBlock.match(/^([A-Za-z0-9\s.,&'-]+?(?:Limited|Ltd|LLP|PVT|Corporation|Inc))\s*(?:,\s*)?([\s\S]*)$/i);
    if (sSplitMatch) {
      shippedToName = sSplitMatch[1].trim();
      shippedToAddress = sSplitMatch[2].replace(/\n+/g, ", ").trim() || buyerAddress;
    } else {
      const sLines = sBlock.split("\n").map((l) => l.trim()).filter(Boolean);
      if (sLines.length > 0) shippedToName = sLines[0];
      if (sLines.length > 1) shippedToAddress = sLines.slice(1).join(", ");
    }
  }

  // Footer & Signatory
  let termsConditions = isBillOfSupply
    ? `1. 50% advance payment along with Purchase order, balance before dispatch.
2. Goods once sold will not be taken back.
3. Our responsibility ceases on delivery to the customers or to the carriers. Claims for shortage or damage reported there after cannot be entertained.
4. Payments should strictly be made through A/c Payee Cheque/Draft/NEFT or RTGS. Cash payments will be accepted only against stamped receipt issued by the Company.
5. All disputes are subject to Ahmedabad Jurisdiction only.`
    : `1. Scope of customer Goods unloading.
2. Goods once sold will not be taken back.
3. Our responsibility ceases on delivery to the customers or to the carriers. Claims for shortage or damage reported there after cannot be entertained.
4. All disputes are subject to Ahmedabad Jurisdiction only.`;

  const termsMatch = text.match(/Terms\s*&\s*Conditions?\s*:?\s*([\s\S]*?)(?:FOR\s*ANASTOMOSIS|BANK\s*DETAILS|Authorised|$)/i);
  if (termsMatch) {
    const rawTerms = termsMatch[1].trim();
    if (rawTerms.length > 20) {
      termsConditions = rawTerms;
    }
  }

  const signatoryCompanyText = "FOR ANASTOMOSIS ENTERPRISE LLP";
  const signatoryLabel = "Authorised Signature";

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
    Company_Name: companyName,
    Company_Address: companyAddress,
    Company_GSTIN: companyGstin,
    Terms_Conditions: termsConditions,
    Signatory_Company_Text: signatoryCompanyText,
    Signatory_Label: signatoryLabel,
    Item_Description: itemDesc,
    HSN_Code: hsnCode,
    Quantity: quantity,
    Unit: unit,
    Rate: rate,
    GST_Rate: gstRate,
    Tax_Subtext: hsnCode ? `GST-${gstRate}% (HSN ${hsnCode})` : `GST-${gstRate}%`,
  };
}
