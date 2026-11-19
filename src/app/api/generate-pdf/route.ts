import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { generateDeliveryChallanHtml } from "@/lib/pdfTemplate";
import { generateTaxInvoiceHtml } from "@/lib/taxInvoicePdfTemplate";
import { InvoiceData } from "@/types/invoice";
import { TaxInvoiceData } from "@/types/taxInvoice";

export async function POST(req: NextRequest) {
  try {
    let body: InvoiceData;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = (await req.json()) as InvoiceData;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      const rawPayload = formData.get("payload");
      if (typeof rawPayload === "string") {
        body = JSON.parse(rawPayload);
      } else {
        return NextResponse.json(
          { error: "Missing payload form field" },
          { status: 400 }
        );
      }
    } else {
      const text = await req.text();
      body = JSON.parse(text) as InvoiceData;
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid invoice payload" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const isInline = searchParams.get("view") === "1" || searchParams.get("inline") === "true";
    const dispositionType = isInline ? "inline" : "attachment";

    const isTaxInvoice =
      (body as unknown as Record<string, unknown>).docType === "invoice" ||
      searchParams.get("type") === "invoice";

    const invoiceNo = String(body.Invoice_No || "").trim();
    const defaultName = isTaxInvoice ? "Bill_of_Supply" : "Delivery_Challan";
    const safeFilename = (invoiceNo || defaultName).replace(
      /[/\\?%*:|"<>]/g,
      "_"
    );

    // Generate HTML for either Bill of Supply or Delivery Challan
    const htmlContent = isTaxInvoice
      ? generateTaxInvoiceHtml(body as unknown as TaxInvoiceData)
      : generateDeliveryChallanHtml(body);

    if (searchParams.get("html") === "1" || searchParams.get("debug") === "1") {
      return new Response(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Launch Puppeteer with optimized flags
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded",
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();

      return new Response(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${dispositionType}; filename="${safeFilename}.pdf"; filename*=UTF-8''${encodeURIComponent(safeFilename)}.pdf`,
          "Content-Length": pdfBuffer.byteLength.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } catch (innerError) {
      await browser.close();
      throw innerError;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: message },
      { status: 500 }
    );
  }
}
