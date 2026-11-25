import { TaxInvoiceData } from "@/types/taxInvoice";
import { numberToWordsIndian } from "./numberToWords";
import { formatDateIndian } from "./dateUtils";

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

function formatCurrency(val: unknown): string {
  if (val === undefined || val === null || val === "") return "";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  if (isNaN(num)) return cleanStr(val);
  return num.toFixed(2);
}

export function generateTaxInvoiceHtml(invoice: TaxInvoiceData): string {
  const companyName = cleanStr(invoice.Company_Name || "ANASTOMOSIS ENTERPRISE LLP");
  const companyAddress = cleanStr(
    invoice.Company_Address ||
      "A-715, KRISH ELITE, S P RING ROAD, NIKOL, Ahmedabad-380049, Gujarat- India"
  );
  const companyGstin = cleanStr(invoice.Company_GSTIN || "24ABWFA7922J1ZY");

  const termsConditions = invoice.Terms_Conditions || `1. 50% advance payment along with Purchase order, balance before dispatch.
2. Goods once sold will not be taken back.
3. Our responsibility ceases on delivery to the customers or to the carriers. Claims for shortage or damage reported there after cannot be entertained.
4. Payments should strictly be made through A/c Payee Cheque/Draft/NEFT or RTGS. Cash payments will be accepted only against stamped receipt issued by the Company.
5. All disputes are subject to Ahmedabad Jurisdiction only.`;
  const signatoryCompanyText = cleanStr(invoice.Signatory_Company_Text || "FOR ANASTOMOSIS ENTERPRISE LLP");
  const signatoryLabel = cleanStr(invoice.Signatory_Label || "Authorised Signature");

  const invoiceNo = cleanStr(invoice.Invoice_No);
  const invoiceDate = formatDateIndian(cleanStr(invoice.Invoice_Date));
  const dcNo = cleanStr(invoice.DC_No);
  const dcDate = formatDateIndian(cleanStr(invoice.DC_Date));
  const poNo = cleanStr(invoice.PO_No);
  const vehicleNo = cleanStr(invoice.Vehicle_No);

  const billedToName = cleanStr(
    invoice.Billed_To_Name || "M/S. Reliance New Solar Energy Limited"
  );
  const billedToAddress = cleanStr(
    invoice.Billed_To_Address ||
      "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
  );
  const billedToState = cleanStr(invoice.Billed_To_State || "Gujarat, India");
  const billedToStateCode = cleanStr(invoice.Billed_To_State_Code || "24");

  const shippedToName = cleanStr(
    invoice.Shipped_To_Name || "Reliance New Solar Energy Limited"
  );
  const shippedToAddress = cleanStr(
    invoice.Shipped_To_Address ||
      "Near Village Kana Chhikari, Navagam, Lalpur, District: Jamnagar - 361006"
  );
  const shippedToState = cleanStr(invoice.Shipped_To_State || "Gujarat, India");
  const shippedToStateCode = cleanStr(invoice.Shipped_To_State_Code || "24");

  const buyerGstin = cleanStr(invoice.Buyer_GSTIN || "24AALCR0464R1ZT");
  const buyerPan = cleanStr(invoice.Buyer_PAN || "AALCR0464R");
  const vendorCode = cleanStr(invoice.Vendor_Code || "3778226");
  const placeOfSupply = cleanStr(invoice.Place_Of_Supply || "GUJARAT");

  // Format Dispatched Vehicle text with Vehicle No and Number both in BOLD
  let renderedVehicleHtml = 'Transport, <span class="font-bold">Vehicle No &mdash;</span>';
  if (vehicleNo) {
    const cleanPlate = vehicleNo.replace(/^(Transport,?\s*)?(Vehicle\s*No\.?\s*:?\s*)?/i, "").trim();
    renderedVehicleHtml = `Transport, <span class="font-bold">Vehicle No ${cleanPlate}</span>`;
  } else if (invoice.Dispatched_Through) {
    const dt = cleanStr(invoice.Dispatched_Through);
    const match = dt.match(/^(Transport,?\s*)?(Vehicle\s*No\.?\s*:?\s*)?(.*)$/i);
    if (match && match[3]) {
      const plate = match[3].trim();
      renderedVehicleHtml = `Transport, <span class="font-bold">Vehicle No ${plate}</span>`;
    } else {
      renderedVehicleHtml = `<span class="font-bold">${dt}</span>`;
    }
  }

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  let computedTaxableSubtotal = 0;
  let computedGstSubtotal = 0;
  let computedTotalAmount = 0;

  // Process rows
  const processedItems = items.map((it, idx) => {
    const qty = typeof it.Quantity === "number" ? it.Quantity : parseFloat(String(it.Quantity || 0));
    const rate = typeof it.Rate === "number" ? it.Rate : parseFloat(String(it.Rate || 0));

    // Taxable amount
    let taxable = typeof it.Taxable_Amount === "number" ? it.Taxable_Amount : parseFloat(String(it.Taxable_Amount || ""));
    if (isNaN(taxable) || taxable === 0) {
      taxable = !isNaN(qty) && !isNaN(rate) ? qty * rate : 0;
    }

    // GST Rate (handles 0% without falsy fallback to 5%)
    let gstRate = 0;
    if (it.GST_Rate !== undefined && it.GST_Rate !== null && it.GST_Rate !== "") {
      const parsedG = parseFloat(String(it.GST_Rate).replace(/%/g, "").trim());
      gstRate = isNaN(parsedG) ? 0 : parsedG;
    } else {
      gstRate = 5;
    }

    // GST Amount (editable/overridable or calculated)
    let gstAmount = 0;
    if (it.GST_Amount !== undefined && it.GST_Amount !== null && it.GST_Amount !== "") {
      const parsedGstAmt = parseFloat(String(it.GST_Amount));
      gstAmount = isNaN(parsedGstAmt) ? 0 : parsedGstAmt;
    } else {
      gstAmount = (taxable * gstRate) / 100;
    }

    // Total Amount
    let total = typeof it.Total_Amount === "number" ? it.Total_Amount : parseFloat(String(it.Total_Amount || ""));
    if (isNaN(total) || total === 0) {
      total = taxable + gstAmount;
    }

    computedTaxableSubtotal += taxable;
    computedGstSubtotal += gstAmount;
    computedTotalAmount += total;

    // Subtext under Description of Goods
    // Dynamically generated to always match current HSN Code and current GST Rate
    const hsnStr = cleanStr(it.HSN_Code);
    const dynamicSubtext = hsnStr ? `GST-${gstRate}% (HSN ${hsnStr})` : `GST-${gstRate}%`;
    let subtext = "";
    if (
      it.Tax_Subtext &&
      it.Tax_Subtext.trim() !== "" &&
      !it.Tax_Subtext.includes("2303 10 00") &&
      !it.Tax_Subtext.includes("GST-5% (HSN 2303")
    ) {
      subtext = cleanStr(it.Tax_Subtext);
    } else {
      subtext = dynamicSubtext;
    }

    return {
      sr: it.Sr || idx + 1,
      desc: cleanStr(it.Item_Description),
      hsn: hsnStr,
      qty: it.Quantity !== undefined && it.Quantity !== null && it.Quantity !== "" ? String(it.Quantity) : "",
      unit: cleanStr(it.Unit),
      rate: !isNaN(rate) && rate > 0 ? rate.toFixed(2) : "",
      taxableAmount: !isNaN(taxable) && taxable > 0 ? taxable.toFixed(2) : "",
      gstRate: `${gstRate}%`,
      gstAmount: !isNaN(gstAmount) ? gstAmount.toFixed(2) : "0.00",
      totalAmount: !isNaN(total) && total > 0 ? total.toFixed(2) : "",
      subtext: cleanStr(subtext),
    };
  });

  // Calculate taxes
  const totalBeforeTax =
    invoice.Total_Amount_Before_Tax !== undefined && invoice.Total_Amount_Before_Tax !== ""
      ? parseFloat(String(invoice.Total_Amount_Before_Tax))
      : computedTaxableSubtotal;

  // Check intra-state vs inter-state
  const isIntraState =
    billedToStateCode === "24" ||
    placeOfSupply.toUpperCase().includes("GUJARAT") ||
    !placeOfSupply;

  const defaultSplitRate = computedGstSubtotal === 0 && computedTaxableSubtotal > 0 ? "0%" : "2.5%";

  let cgstRate =
    invoice.CGST_Rate !== undefined && invoice.CGST_Rate !== null && invoice.CGST_Rate !== ""
      ? String(invoice.CGST_Rate).trim()
      : defaultSplitRate;
  if (cgstRate && !cgstRate.includes("%")) cgstRate += "%";

  let sgstRate =
    invoice.SGST_Rate !== undefined && invoice.SGST_Rate !== null && invoice.SGST_Rate !== ""
      ? String(invoice.SGST_Rate).trim()
      : defaultSplitRate;
  if (sgstRate && !sgstRate.includes("%")) sgstRate += "%";

  let igstRate =
    invoice.IGST_Rate !== undefined && invoice.IGST_Rate !== null && invoice.IGST_Rate !== ""
      ? String(invoice.IGST_Rate).trim()
      : computedGstSubtotal === 0 && computedTaxableSubtotal > 0 ? "0%" : "5%";
  if (igstRate && !igstRate.includes("%")) igstRate += "%";

  let cgstAmount = computedGstSubtotal / 2;
  let sgstAmount = computedGstSubtotal / 2;
  let igstAmount = computedGstSubtotal;

  if (invoice.CGST_Amount !== undefined && invoice.CGST_Amount !== "") {
    const val = parseFloat(String(invoice.CGST_Amount));
    if (!isNaN(val)) cgstAmount = val;
  }
  if (invoice.SGST_Amount !== undefined && invoice.SGST_Amount !== "") {
    const val = parseFloat(String(invoice.SGST_Amount));
    if (!isNaN(val)) sgstAmount = val;
  }
  if (invoice.IGST_Amount !== undefined && invoice.IGST_Amount !== "") {
    const val = parseFloat(String(invoice.IGST_Amount));
    if (!isNaN(val)) igstAmount = val;
  }

  const roundOff =
    invoice.Round_Off !== undefined && invoice.Round_Off !== ""
      ? parseFloat(String(invoice.Round_Off))
      : 0;

  const totalAfterTax =
    invoice.Total_Amount_After_Tax !== undefined && invoice.Total_Amount_After_Tax !== ""
      ? parseFloat(String(invoice.Total_Amount_After_Tax))
      : isIntraState
      ? totalBeforeTax + cgstAmount + sgstAmount + roundOff
      : totalBeforeTax + igstAmount + roundOff;

  const amountInWords =
    invoice.Amount_In_Words || numberToWordsIndian(totalAfterTax);

  // Minimum row count so invoice matches physical paper layout
  const minRows = Math.max(5, 7 - processedItems.length);
  const emptyRowsHtml = Array.from({ length: minRows })
    .map(
      () => `
      <tr class="empty-row">
        <td class="text-center">&nbsp;</td>
        <td></td>
        <td class="text-center"></td>
        <td class="text-right"></td>
        <td class="text-center"></td>
        <td class="text-right"></td>
        <td class="text-right"></td>
        <td class="text-center"></td>
        <td class="text-right"></td>
        <td class="text-right"></td>
      </tr>
    `
    )
    .join("");

  const bankName = cleanStr(invoice.Bank_Name || "Axis Bank");
  const beneficiaryName = cleanStr(
    invoice.Beneficiary_Name || "ANASTOMOSIS ENTERPRISE LLP"
  );
  const branchName = cleanStr(invoice.Branch_Name || "Bapunagar, Ahmedabad");
  const accountNo = cleanStr(invoice.Account_No || "922020018751377");
  const ifscCode = cleanStr(invoice.IFSC_Code || "UTIB0000664");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill of Supply - ${invoiceNo || "ANASTOMOSIS"}</title>
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
    .invoice-wrapper {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      border: 2px solid #000;
    }
    .table-border {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    .table-border th, .table-border td {
      border: 1px solid #000;
      padding: 3.5px 5px;
      vertical-align: top;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }

    /* Header styling */
    .doc-title {
      font-size: 14px;
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
      padding: 1px 10px 4px 10px;
      border-bottom: 1px solid #000;
    }
    .company-gst {
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      padding: 3px 0;
      border-bottom: 1px solid #000;
    }

    /* Receiver & Dispatch Grid */
    .receiver-box {
      border-bottom: 1px solid #000;
    }
    .receiver-header {
      font-weight: bold;
      padding: 3px 6px;
      border-bottom: 1px solid #000;
      font-size: 11.5px;
    }
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
      padding: 3px 5px;
      border: none;
      vertical-align: top;
    }
    .meta-label {
      width: 40%;
      font-weight: bold;
      border-right: 1px solid #000;
    }
    .meta-val {
      width: 60%;
      font-weight: normal;
      padding-left: 6px !important;
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
      font-size: 10.5px;
      border: 1px solid #000;
      padding: 4px 3px;
      text-align: center;
    }
    .items-table td {
      border-left: 1px solid #000;
      border-right: 1px solid #000;
      border-top: none;
      border-bottom: none;
      padding: 3.5px 4px;
      font-size: 10.5px;
    }
    .items-table tr.sub-total td {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      font-weight: bold;
      padding: 4px 4px;
    }
    .items-table tr.empty-row td {
      padding: 7px 4px;
    }
    .subtext-row td {
      border-top: none !important;
      padding-top: 0 !important;
      font-size: 10px;
      color: #111;
    }

    /* Bottom Summary Section */
    .summary-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000;
    }
    .summary-left {
      display: table-cell;
      width: 58%;
      border-right: 1px solid #000;
      padding: 5px 6px;
      vertical-align: top;
    }
    .summary-right {
      display: table-cell;
      width: 42%;
      padding: 0;
      vertical-align: top;
    }
    .tax-breakdown-table {
      width: 100%;
      border-collapse: collapse;
    }
    .tax-breakdown-table td {
      padding: 3px 6px;
      border-bottom: 1px solid #000;
      font-size: 11px;
    }
    .tax-breakdown-table tr:last-child td {
      border-bottom: none;
      font-weight: bold;
    }

    /* Amount in words banner */
    .words-banner {
      padding: 4px 6px;
      border-bottom: 1px solid #000;
      font-size: 10.5px;
      font-weight: bold;
      letter-spacing: 0.2px;
    }

    /* Footer & Terms & Signature */
    .footer-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1px solid #000;
    }
    .terms-col {
      display: table-cell;
      width: 58%;
      border-right: 1px solid #000;
      padding: 5px 6px;
      vertical-align: top;
      font-size: 9.5px;
      line-height: 1.35;
    }
    .signature-col {
      display: table-cell;
      width: 42%;
      padding: 6px 10px;
      vertical-align: top;
      position: relative;
    }
    .sign-header {
      font-size: 11px;
      font-weight: bold;
      color: #000;
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

    /* Bank Details Table */
    .bank-header {
      padding: 3px 6px;
      font-weight: bold;
      font-size: 11px;
      border-bottom: 1px solid #000;
    }
    .bank-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .bank-table th {
      border-right: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 4px;
      text-align: center;
      font-weight: bold;
      background: #fff;
    }
    .bank-table td {
      border-right: 1px solid #000;
      padding: 4px 5px;
      text-align: center;
      background-color: #ebd1d0;
      font-weight: 500;
    }
    .bank-table tr th:last-child,
    .bank-table tr td:last-child {
      border-right: none;
    }
  </style>
</head>
<body>

  <div class="invoice-wrapper">
    <!-- Header Title -->
    <div class="doc-title">BILL OF SUPPLY</div>

    <!-- Company Branding -->
    <div class="company-name">${companyName}</div>
    <div class="company-address">${companyAddress}</div>
    <div class="company-gst">GST No.: ${companyGstin}</div>

    <!-- Receiver Header -->
    <div class="receiver-header">Details of Receiver(Billed to):</div>

    <!-- Receiver & Invoice Details Row 1 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left">
        <div style="font-weight: bold; line-height: 1.35;">
          ${billedToName}, ${billedToAddress} State: ${billedToState} State Code: ${billedToStateCode}
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
          Shipped To: ${shippedToName}, ${shippedToAddress} State: ${shippedToState} State Code: ${shippedToStateCode}
        </div>
      </div>
      <div class="col-right">
        <table class="meta-table">
          <tr>
            <td class="meta-label">DC No. :</td>
            <td class="meta-val font-bold">${dcNo || "&mdash;"}</td>
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
        <div>GST NO. ${buyerGstin || "&mdash;"}</div>
        <div>PAN NO. ${buyerPan || "&mdash;"}</div>
      </div>
      <div class="col-right" style="padding: 4px 6px;">
        <div class="font-bold">Reliance Vendor Code: <span class="font-bold">${vendorCode || "&mdash;"}</span></div>
        <div class="font-bold">PO NO: <span class="font-bold">${poNo || "&mdash;"}</span></div>
      </div>
    </div>

    <!-- Place of Supply & Vehicle Row 4 -->
    <div class="two-col-grid" style="border-bottom: 1px solid #000;">
      <div class="col-left font-bold" style="padding: 4px 6px; text-align: center; vertical-align: middle;">
        PLACE OF SUPPLY: ${placeOfSupply.toUpperCase()}
      </div>
      <div class="col-right" style="padding: 0;">
        <div style="display: table; width: 100%;">
          <div style="display: table-cell; font-weight: bold; width: 25%; padding: 3px 6px; border-right: 1px solid #000; vertical-align: middle; line-height: 1.25;">
            Dispatched<br/>Through :
          </div>
          <div style="display: table-cell; padding: 4px 6px; vertical-align: middle; white-space: nowrap;">
            ${renderedVehicleHtml}
          </div>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 30px;">Sr.</th>
          <th>Description of Goods</th>
          <th style="width: 70px;">HSN<br/>Code</th>
          <th style="width: 48px;">Qty</th>
          <th style="width: 40px;">Unit</th>
          <th style="width: 65px;">Rate</th>
          <th style="width: 80px;">Taxable<br/>Amount</th>
          <th colspan="2" style="width: 105px; padding: 0;">
            <div style="border-bottom: 1px solid #000; padding: 2px 0;">GST</div>
            <div style="display: table; width: 100%;">
              <div style="display: table-cell; width: 38%; border-right: 1px solid #000; padding: 1px 0;">Rate</div>
              <div style="display: table-cell; width: 62%; padding: 1px 0;">Amount</div>
            </div>
          </th>
          <th style="width: 85px;">Total<br/>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${processedItems
          .map(
            (item) => `
          <tr>
            <td class="text-center font-bold">${item.sr}</td>
            <td class="font-bold">${item.desc}</td>
            <td class="text-center">${item.hsn}</td>
            <td class="text-right font-bold">${item.qty}</td>
            <td class="text-center">${item.unit}</td>
            <td class="text-right">${item.rate}</td>
            <td class="text-right font-bold">${item.taxableAmount}</td>
            <td class="text-center" style="width: 40px;">${item.gstRate}</td>
            <td class="text-right" style="width: 65px;">${item.gstAmount}</td>
            <td class="text-right font-bold">${item.totalAmount}</td>
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

        <!-- Empty Rows for Visual Balance -->
        ${emptyRowsHtml}

        <!-- Table Subtotal Row -->
        <tr class="sub-total">
          <td class="text-center"></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td class="text-right font-bold">${formatCurrency(computedTaxableSubtotal)}</td>
          <td class="text-center"></td>
          <td class="text-right font-bold">${formatCurrency(computedGstSubtotal)}</td>
          <td class="text-right"></td>
        </tr>
      </tbody>
    </table>

    <!-- Totals & Tax Breakdown Grid -->
    <div class="summary-grid">
      <div class="summary-left">
        <div class="font-bold">Note:</div>
        <div style="margin-top: 4px; font-size: 10.5px;">${cleanStr(invoice.Note || "")}</div>
      </div>
      <div class="summary-right">
        <table class="tax-breakdown-table">
          <tr>
            <td class="text-left font-bold" style="width: 60%;">Total Amount Before Tax:</td>
            <td class="text-right font-bold" style="width: 40%;">${formatCurrency(totalBeforeTax)}</td>
          </tr>
          ${
            isIntraState
              ? `
          <tr>
            <td class="text-left font-bold">CGST &nbsp;&nbsp;&nbsp;&nbsp; ${cgstRate}</td>
            <td class="text-right">${formatCurrency(cgstAmount)}</td>
          </tr>
          <tr>
            <td class="text-left font-bold">SGST &nbsp;&nbsp;&nbsp;&nbsp; ${sgstRate}</td>
            <td class="text-right">${formatCurrency(sgstAmount)}</td>
          </tr>
          `
              : `
          <tr>
            <td class="text-left font-bold">IGST &nbsp;&nbsp;&nbsp;&nbsp; ${igstRate}</td>
            <td class="text-right">${formatCurrency(igstAmount)}</td>
          </tr>
          `
          }
          <tr>
            <td class="text-left font-bold">Round off</td>
            <td class="text-right">${formatCurrency(roundOff)}</td>
          </tr>
          <tr style="background: #fafafa;">
            <td class="text-left font-bold" style="font-size: 11.5px;">Total Amount After Tax :</td>
            <td class="text-right font-bold" style="font-size: 11.5px;">${formatCurrency(totalAfterTax)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Total Amount In Words -->
    <div class="words-banner">
      TOTAL AMOUNT IN WORDS:- <span style="font-weight: normal; margin-left: 4px;">${amountInWords}</span>
    </div>

    <!-- Footer: Terms & Condition + Digital Signature -->
    <div class="footer-grid">
      <div class="terms-col">
        <div class="font-bold" style="margin-bottom: 2px;">Terms & Condition :</div>
        <div style="white-space: pre-line;">${escapeHtml(termsConditions)}</div>
      </div>

      <div class="signature-col">
        <div class="sign-header">${signatoryCompanyText}</div>
        <div class="sign-space"></div>
        <div class="authorised-signatory-label">
          ${signatoryLabel}
        </div>
      </div>
    </div>

    <!-- Bank Details Table -->
    <div class="bank-header">BANK DETAILS :</div>
    <table class="bank-table">
      <thead>
        <tr>
          <th style="width: 35px;">S.N.</th>
          <th>BANK NAME</th>
          <th>BENEFICIARY DETAILS</th>
          <th>BRANCH</th>
          <th>ACCOUNT NO</th>
          <th>IFSC CODE</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${bankName}</td>
          <td>${beneficiaryName}</td>
          <td>${branchName}</td>
          <td style="font-family: monospace; font-weight: bold;">${accountNo}</td>
          <td style="font-family: monospace; font-weight: bold;">${ifscCode}</td>
        </tr>
      </tbody>
    </table>
  </div>

</body>
</html>`;
}

