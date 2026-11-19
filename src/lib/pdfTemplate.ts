import { InvoiceData } from "@/types/invoice";
import { formatDateIndian } from "@/lib/dateUtils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanStr(val: unknown): string {
  if (val === undefined || val === null) return "";
  const s = String(val).trim();
  if (s.toLowerCase() === "undefined" || s.toLowerCase() === "null") return "";
  return escapeHtml(s);
}

export function generateDeliveryChallanHtml(invoice: InvoiceData): string {
  const invoiceNo = cleanStr(invoice.Invoice_No);
  const invoiceDate = formatDateIndian(cleanStr(invoice.Invoice_Date));
  const dcNo = cleanStr(invoice.DC_No || invoice.Invoice_No);
  const dcDate = formatDateIndian(cleanStr(invoice.DC_Date || invoice.Invoice_Date));
  const poNo = cleanStr(invoice.PO_No || "241128591");
  const vehicleNo = cleanStr(invoice.Vehicle_No || "RJ09GE7594");
  const cleanVehiclePlate = vehicleNo.replace(/^(Transport,?\s*)?(Vehicle\s*No\.?\s*:?\s*)?/i, "").trim();
  const location = cleanStr(invoice.Location || "NAVSARI CBG");

  const buyerName = cleanStr(
    invoice.Buyer_Name || "M/S. Reliance Industries Limited"
  );
  const buyerAddress = cleanStr(
    invoice.Buyer_Address ||
      "Block No. 601, VILLAGE : KHADSUPA TALUKA : NAVSARI, NAVSARI, GUJARAT-396433"
  );
  const shippedToName = cleanStr(
    invoice.Shipped_To_Name || buyerName
  );
  const shippedToAddress = cleanStr(
    invoice.Shipped_To_Address || buyerAddress
  );
  const buyerGstin = cleanStr(invoice.Buyer_GSTIN || "24AAACR5055K1ZD");
  const buyerPan = cleanStr(invoice.Buyer_PAN || "AAACR5055K");
  const vendorCode = cleanStr(invoice.Vendor_Code || "3778226");

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  let totalQuantity = 0;
  let hasAnyNumericQuantity = false;
  let unitDisplay = "TON";

  const processedItems = items.map((it, idx) => {
    const desc = cleanStr(it.Item_Description);
    const hsn = cleanStr(it.HSN_Code);
    const unit = cleanStr(it.Unit || "TON");
    if (unit) unitDisplay = unit;

    let qtyStr = "";
    if (it.Quantity !== undefined && it.Quantity !== null && it.Quantity !== "") {
      const rawQty = String(it.Quantity).trim();
      const num = parseFloat(rawQty.replace(/,/g, ""));
      if (!isNaN(num)) {
        totalQuantity += num;
        hasAnyNumericQuantity = true;
        qtyStr = num.toFixed(3);
      } else {
        qtyStr = escapeHtml(rawQty);
      }
    }

    const dynamicSubtext = hsn ? `GST-0% (HSN ${hsn})` : "GST-0%";
    let subtext = "";
    if (
      it.Tax_Subtext &&
      it.Tax_Subtext.trim() !== "" &&
      !it.Tax_Subtext.includes("2303 10 00") &&
      !it.Tax_Subtext.includes("GST-5%")
    ) {
      subtext = cleanStr(it.Tax_Subtext);
    } else {
      subtext = dynamicSubtext;
    }

    return {
      sr: idx + 1,
      desc,
      hsn,
      qty: qtyStr,
      unit,
      subtext,
    };
  });

  const totalQtyDisplay = hasAnyNumericQuantity
    ? totalQuantity.toFixed(3)
    : "";

  const minRows = Math.max(5, 7 - processedItems.length);
  const emptyRowsHtml = Array.from({ length: minRows })
    .map(
      () => `
      <tr class="empty-row">
        <td class="text-center">&nbsp;</td>
        <td></td>
        <td></td>
        <td class="text-center"></td>
        <td class="text-center"></td>
        <td class="text-center"></td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Delivery Challan - ${invoiceNo || "Document"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .challan-wrapper {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      border: 2px solid #000;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }

    /* Header styling matching Challan Image */
    .doc-title {
      font-size: 14.5px;
      font-weight: bold;
      text-align: center;
      padding: 5px 0;
      border-bottom: 1px solid #000;
      letter-spacing: 0.5px;
    }
    .company-name {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      padding: 4px 0 2px 0;
      letter-spacing: 0.3px;
    }
    .company-address {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      padding: 2px 10px 4px 10px;
      border-bottom: 1px solid #000;
    }
    .company-gst {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      padding: 3.5px 0;
      border-bottom: 1px solid #000;
    }

    /* Receiver Header */
    .receiver-header {
      font-weight: bold;
      padding: 3.5px 6px;
      border-bottom: 1px solid #000;
      font-size: 11.5px;
    }

    /* 2-Column Section */
    .two-col-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
    }
    .col-left {
      display: table-cell;
      width: 58%;
      border-right: 1px solid #000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .col-right {
      display: table-cell;
      width: 42%;
      padding: 0;
      vertical-align: top;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 3px 6px;
      border: none;
      vertical-align: top;
    }
    .meta-label {
      width: 38%;
      font-weight: bold;
    }
    .meta-val {
      width: 62%;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
    }
    .items-table th {
      background-color: #fff;
      font-weight: bold;
      font-size: 11px;
      border: 1px solid #000;
      padding: 5px 4px;
      text-align: center;
    }
    .items-table td {
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-top: none;
      border-bottom: none;
      padding: 4px 5px;
      font-size: 11px;
    }
    .items-table tr.sub-total td {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      font-weight: bold;
      padding: 4px 5px;
    }
    .items-table tr.empty-row td {
      padding: 8px 4px;
    }
    .subtext-row td {
      border-top: none !important;
      padding-top: 0 !important;
      font-size: 10px;
      color: #111;
    }

    /* Spacer under items table */
    .spacer-box {
      height: 24px;
      border-bottom: 1px solid #000;
    }

    /* Footer: Terms & Signature */
    .footer-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
    }
    .terms-col {
      display: table-cell;
      width: 60%;
      border-right: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
      font-size: 9.5px;
      line-height: 1.4;
    }
    .signature-col {
      display: table-cell;
      width: 40%;
      padding: 6px 8px;
      vertical-align: top;
    }
    .sign-header {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 4px;
      letter-spacing: 0.2px;
    }
    .sign-space {
      height: 85px;
    }
    .authorised-signatory-label {
      text-align: center;
      font-size: 11.5px;
      color: #000;
    }

    /* Standalone bottom box */
    .bottom-border-box {
      height: 18px;
      border: 1.5px solid #000;
      margin-top: 12px;
      width: 100%;
      max-width: 210mm;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>

  <div class="challan-wrapper">
    <!-- Header Title -->
    <div class="doc-title">Delivery Challan</div>

    <!-- Company Branding -->
    <div class="company-name">ANASTOMOSIS ENTERPRISE LLP</div>
    <div class="company-address">Shop no 8, nandipark shopping center, krishnanagr, Ahmedabad-382345. Gujarat- India</div>
    <div class="company-gst">GST No.: 24ABWFA7922J1ZY</div>

    <!-- Receiver Header -->
    <div class="receiver-header">Details of Receiver(Billed to):</div>

    <!-- Receiver & Invoice Details Row 1 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left">
        <div style="font-weight: bold; line-height: 1.35;">
          ${buyerName}<br/>
          ${buyerAddress}
        </div>
      </div>
      <div class="col-right">
        <table class="meta-table">
          <tr>
            <td class="meta-label">Invoice No. :</td>
            <td class="meta-val font-bold">${invoiceNo || "&mdash;"}</td>
          </tr>
          <tr>
            <td class="meta-label">Date :</td>
            <td class="meta-val">${invoiceDate || "&mdash;"}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Shipped To & DC Row 2 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left">
        <div style="font-weight: bold; line-height: 1.35;">
          ${shippedToName}<br/>
          ${shippedToAddress}
        </div>
      </div>
      <div class="col-right">
        <table class="meta-table">
          <tr>
            <td class="meta-label">DC No. :</td>
            <td class="meta-val font-bold">${dcNo || invoiceNo || "&mdash;"}</td>
          </tr>
          <tr>
            <td class="meta-label">Date :</td>
            <td class="meta-val">${dcDate || invoiceDate || "&mdash;"}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Tax Identifiers & PO Row 3 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left font-bold" style="padding: 4px 6px;">
        <div>GST NO. ${buyerGstin || "24AAACR5055K1ZD"}</div>
        <div>PAN NO. ${buyerPan || "AAACR5055K"}</div>
      </div>
      <div class="col-right" style="padding: 4px 6px;">
        <div class="font-bold">Reliance Vendor Code: <span class="font-bold">${vendorCode || "3778226"}</span></div>
        <div class="font-bold">PO NO: <span class="font-bold">${poNo || "&mdash;"}</span></div>
      </div>
    </div>

    <!-- Location & Dispatched Through Row 4 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left font-bold text-center" style="padding: 6px; vertical-align: middle;">
        ${location.toUpperCase()}
      </div>
      <div class="col-right" style="padding: 0;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; font-weight: bold; width: 25%; padding: 3px 6px; border-right: 1px solid #000; vertical-align: middle; line-height: 1.25;">Dispatched<br/>Through :</div>
          <div style="display: table-cell; padding: 4px 6px; vertical-align: middle; white-space: nowrap;">Transport, <span class="font-bold">Vehicle No. ${cleanVehiclePlate || vehicleNo || "&mdash;"}</span></div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 35px;">Sr.</th>
          <th>Description of Goods</th>
          <th style="width: 65px;"></th>
          <th style="width: 95px;">HSN<br/>Code</th>
          <th style="width: 75px;">Qty</th>
          <th style="width: 65px;">Unit</th>
        </tr>
      </thead>
      <tbody>
        ${processedItems
          .map(
            (item) => `
          <tr>
            <td class="text-center font-bold">${item.sr}</td>
            <td class="font-bold">${item.desc}</td>
            <td></td>
            <td class="text-center font-mono">${item.hsn}</td>
            <td class="text-center font-bold">${item.qty}</td>
            <td class="text-center font-bold uppercase">${item.unit}</td>
          </tr>
          ${
            item.subtext
              ? `
          <tr class="subtext-row">
            <td></td>
            <td style="padding-left: 8px;">${item.subtext}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          `
              : ""
          }
        `
          )
          .join("")}

        <!-- Empty Filler Rows -->
        ${emptyRowsHtml}

        <!-- Sub-Total Row -->
        <tr class="sub-total">
          <td></td>
          <td></td>
          <td class="text-center font-bold">Total</td>
          <td></td>
          <td class="text-center font-bold">${totalQtyDisplay}</td>
          <td class="text-center font-bold uppercase">${unitDisplay}</td>
        </tr>
      </tbody>
    </table>

    <!-- Spacer Box Below Table -->
    <div class="spacer-box"></div>

    <!-- Footer: Terms & Condition + Signatory -->
    <div class="footer-grid">
      <div class="terms-col">
        <div class="font-bold" style="margin-bottom: 2px;">Terms & Condition :</div>
        <div>1. Scope of customer Goods unloading.</div>
        <div>2. Goods once sold will not be taken back.</div>
        <div>3. Our responsibility ceases on delivery to the customers or to the carriers. Claims for shortage or damage reported there after cannot be entertained.</div>
        <div>4. All disputes are subject to Ahmedabad Jurisdiction only.</div>
      </div>

      <div class="signature-col">
        <div class="sign-header">FOR ANASTOMOSIS ENTERPRISE LLP</div>
        <div class="sign-space"></div>
        <div class="authorised-signatory-label">
          Authorised Signature
        </div>
      </div>
    </div>
  </div>

  <!-- Standalone Bottom Rectangular Border Box -->
  <div class="bottom-border-box"></div>

</body>
</html>`;
}
