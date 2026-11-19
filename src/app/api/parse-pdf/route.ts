import { NextRequest, NextResponse } from "next/server";
import { parsePdfText } from "@/lib/pdfParser";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save temporary file in OS temp folder
    const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`;
    tmpPath = path.join(os.tmpdir(), tmpFileName);
    await fs.writeFile(tmpPath, buffer);

    const scriptPath = path.resolve(process.cwd(), "scripts", "extract-pdf-text.js");
    const { stdout } = await execFileAsync("node", [scriptPath, tmpPath], {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    const parsedOutput = JSON.parse(stdout);
    if (!parsedOutput.success) {
      throw new Error(parsedOutput.error || "Failed to parse PDF text");
    }

    const rawText = parsedOutput.text || "";
    const parsedTemplate = parsePdfText(rawText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      template: parsedTemplate,
      pageCount: parsedOutput.pageCount || 1,
      rawText: rawText.substring(0, 500), // snippet for debug/preview
    });
  } catch (error: unknown) {
    console.error("PDF Parsing error:", error);
    const msg = error instanceof Error ? error.message : "Failed to parse PDF";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  } finally {
    if (tmpPath) {
      try {
        await fs.unlink(tmpPath);
      } catch {}
    }
  }
}
