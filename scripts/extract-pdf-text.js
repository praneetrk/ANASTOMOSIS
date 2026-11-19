const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node extract-pdf-text.js <path-to-pdf>");
    process.exit(1);
  }

  try {
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const textResult = await parser.getText();
    const rawText = textResult?.text || "";
    const total = textResult?.total || 1;
    await parser.destroy();

    process.stdout.write(
      JSON.stringify({
        success: true,
        text: rawText,
        pageCount: total,
      })
    );
  } catch (err) {
    console.error(err);
    process.stdout.write(
      JSON.stringify({
        success: false,
        error: err.message || "Failed to extract PDF text",
      })
    );
    process.exit(1);
  }
}

main();

