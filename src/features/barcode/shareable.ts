import { isValidEan13 } from "./ean13";

// Which product keys (GTIN-13) may enter the shared products table.
// Store-internal, coupon and refund numbers are not unique worldwide, so they are never shared.
//
// Source caveat: these rules were checked on 2026-10-29 against the GS1 prefix page and
// the GSCN 23-006 extract (sections 2.1.11 and 2.1.11.1), NOT the full GS1 General Specifications.
// Re-check against the full General Specifications before sharing is switched on.

const BLOCKED_PREFIXES = [
  "2", // 200-299: restricted circulation (in-store numbers)
  "02", // 020-029: restricted circulation
  "04", // 040-049: restricted circulation (company internal)
  "05", // 050-059: coupons
  "98", // coupons and refund receipts (whole range blocked to be safe)
  "99", // coupons (whole range blocked to be safe)
  "000000", // internal numbers; 0000001-0000099 are unused
] as const;

/** True when a valid 13-digit product key may be shared with other users. */
export function isShareableGtin13(gtin13: string): boolean {
  if (!isValidEan13(gtin13)) return false;
  if (BLOCKED_PREFIXES.some((prefix) => gtin13.startsWith(prefix))) return false;
  // A padded EAN-8 (00000 + 8 digits) must not start with 0 or 2 itself.
  // The 0 case is also caught by "000000"; it stays here so this line matches the GS1 rule.
  if (gtin13.startsWith("00000") && (gtin13[5] === "0" || gtin13[5] === "2")) return false;
  return true;
}
