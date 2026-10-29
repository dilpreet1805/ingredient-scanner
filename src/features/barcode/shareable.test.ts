import { describe, expect, it } from "vitest";

import { ean13CheckDigit } from "./ean13";
import { isShareableGtin13 } from "./shareable";

// Builds a valid 13-digit key from 12 digits, so no test depends on a hand-calculated check digit.
const key = (first12: string) => first12 + String(ean13CheckDigit(first12));

describe("isShareableGtin13", () => {
  it.each([
    ["starts with 2 (200-299)", key("250000000001")],
    ["starts with 02 (020-029)", key("020000000001")],
    ["starts with 04 (040-049)", key("040000000001")],
    ["starts with 05 (050-059)", key("050000000001")],
    ["starts with 98", key("980000000001")],
    ["starts with 99", key("990000000001")],
    ["starts with 000000", key("000000123456")],
    ["padded EAN-8 starting with 0", key("000000345678")],
    ["padded EAN-8 starting with 2", key("000002345678")],
  ])("blocks a key that %s", (_rule, gtin13) => {
    expect(isShareableGtin13(gtin13)).toBe(false);
  });

  it.each([
    ["an Indian 890 code", "8901234567890"],
    ["a German 400 code (40-49 is NOT blocked: 400-440 is GS1 Germany)", "4006381333931"],
    ["a UPC-A with its leading 0", "0036000291452"],
    ["a padded EAN-8 that starts with 9", "0000096385074"],
  ])("shares %s", (_label, gtin13) => {
    expect(isShareableGtin13(gtin13)).toBe(true);
  });

  it("never shares an invalid key", () => {
    for (const bad of ["8901234567891", "890123456789", ""]) {
      expect(isShareableGtin13(bad)).toBe(false);
    }
  });
});
