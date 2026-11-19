const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];

const TENS = [
  "",
  "",
  "TWENTY",
  "THIRTY",
  "FORTY",
  "FIFTY",
  "SIXTY",
  "SEVENTY",
  "EIGHTY",
  "NINETY",
];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const unit = n % 10;
  const ten = Math.floor(n / 10);
  return unit ? `${TENS[ten]} ${ONES[unit]}` : TENS[ten];
}

function threeDigitsToWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  if (!hundred) return twoDigitsToWords(remainder);
  const remWords = remainder ? ` ${twoDigitsToWords(remainder)}` : "";
  return `${ONES[hundred]} HUNDRED${remWords}`;
}

export function numberToWordsIndian(amount: number): string {
  if (isNaN(amount) || amount === 0) return "ZERO RUPEES ONLY";

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let rupeesWords = "";

  if (rupees === 0) {
    rupeesWords = "ZERO";
  } else {
    let rem = rupees;

    // Crores (> 99,99,999)
    const crores = Math.floor(rem / 10000000);
    rem %= 10000000;
    if (crores > 0) {
      rupeesWords += `${threeDigitsToWords(crores)} CRORE `;
    }

    // Lakhs (> 99,999)
    const lakhs = Math.floor(rem / 100000);
    rem %= 100000;
    if (lakhs > 0) {
      rupeesWords += `${twoDigitsToWords(lakhs)} LAKH `;
    }

    // Thousands (> 999)
    const thousands = Math.floor(rem / 1000);
    rem %= 1000;
    if (thousands > 0) {
      rupeesWords += `${twoDigitsToWords(thousands)} THOUSAND `;
    }

    // Remaining hundreds and below
    if (rem > 0) {
      rupeesWords += `${threeDigitsToWords(rem)} `;
    }
  }

  rupeesWords = rupeesWords.trim() + " RUPEES";

  let paiseWords = "";
  if (paise > 0) {
    paiseWords = ` AND ${twoDigitsToWords(paise)} PAISE`;
  }

  const result = `${isNegative ? "MINUS " : ""}${rupeesWords}${paiseWords} ONLY`;
  return result.replace(/\s+/g, " ").trim();
}

