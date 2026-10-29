import { isValidEan13 } from "./ean13";

// Each barcode format becomes one 13-digit key (GTIN-13), so the same product
// always gets the same key, whichever phone or format scanned it.
// Adding zeros on the left never changes a valid check digit.

function zerosFor(format: string): string | null {
  switch (format) {
    case "ean13":
      return "";
    case "upc_a":
      return "0";
    case "ean8":
      return "00000";
    default:
      return null; // includes upc_e (not supported yet) and non-product codes like qr
  }
}

/** The 13-digit product key for a scanned code, or null if the format is unsupported or the code is invalid. */
export function toGtin13(format: string, code: string): string | null {
  const zeros = zerosFor(format);
  if (zeros === null) return null;
  const gtin13 = zeros + code;
  return isValidEan13(gtin13) ? gtin13 : null;
}
