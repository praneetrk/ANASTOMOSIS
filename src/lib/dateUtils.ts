/**
 * Converts various date formats (American MM/DD/YYYY, ISO YYYY-MM-DD, Excel serials, JS Dates)
 * into standard Indian format: DD/MM/YYYY
 */
export function formatDateIndian(input?: unknown): string {
  if (input === undefined || input === null) return "";

  if (input instanceof Date && !isNaN(input.getTime())) {
    const day = String(input.getDate()).padStart(2, "0");
    const month = String(input.getMonth() + 1).padStart(2, "0");
    const year = input.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(input).trim();
  if (!str || str === "undefined" || str === "null" || str === "NaN") return "";

  // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (e.g. 2026-10-27, 2026/10/27)
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, "0");
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, "0");
    return `${day}/${month}/${year}`;
  }

  // 2. 4-digit year: DD/MM/YYYY or MM/DD/YYYY with separator [/.-]
  const fullYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (fullYearMatch) {
    const p1 = parseInt(fullYearMatch[1], 10);
    const p2 = parseInt(fullYearMatch[2], 10);
    const year = fullYearMatch[3];

    // If p1 > 12, it is unambiguously Day/Month/Year (e.g. 27/10/2026)
    if (p1 > 12) {
      return `${String(p1).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${year}`;
    }
    // If p2 > 12, it is unambiguously Month/Day/Year (e.g. 10/27/2026) -> convert to Day/Month/Year
    if (p2 > 12) {
      return `${String(p2).padStart(2, "0")}/${String(p1).padStart(2, "0")}/${year}`;
    }
    // Both <= 12: In India, standard interpretation for slashed/dashed dates is DD/MM/YYYY
    return `${String(p1).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${year}`;
  }

  // 3. 2-digit year: DD/MM/YY or MM/DD/YY (e.g. 10/27/26 or 27/10/26)
  const shortYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (shortYearMatch) {
    const p1 = parseInt(shortYearMatch[1], 10);
    const p2 = parseInt(shortYearMatch[2], 10);
    const yy = parseInt(shortYearMatch[3], 10);
    const year = String(yy >= 70 ? 1900 + yy : 2000 + yy);

    if (p1 > 12) {
      return `${String(p1).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${year}`;
    }
    if (p2 > 12) {
      // American MM/DD/YY (e.g. 10/27/26 -> 27/10/2026)
      return `${String(p2).padStart(2, "0")}/${String(p1).padStart(2, "0")}/${year}`;
    }
    return `${String(p1).padStart(2, "0")}/${String(p2).padStart(2, "0")}/${year}`;
  }

  // 4. Try JS Date parser for textual formats like "Tue Oct 27 2026" or "27 Oct 2026"
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970 && parsed.getFullYear() < 2100) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

