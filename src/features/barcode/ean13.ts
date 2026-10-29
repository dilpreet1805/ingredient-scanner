// EAN-13 is the 13-digit number under most retail barcodes.
// The last digit is a check digit calculated from the first 12,
// so a misread or mistyped digit is caught before any lookup.

const TWELVE_DIGITS = /^[0-9]{12}$/;
const THIRTEEN_DIGITS = /^[0-9]{13}$/;

/** Check digit for the first 12 digits, or null if the input is not exactly 12 digits. */
export function ean13CheckDigit(first12: string): number | null {
  if (!TWELVE_DIGITS.test(first12)) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(first12[i]);
    // Weights from the left: 1, 3, 1, 3, ...
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

/** True when code is exactly 13 digits and its last digit is the correct check digit. */
export function isValidEan13(code: string): boolean {
  if (!THIRTEEN_DIGITS.test(code)) return false;
  return ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);
}
