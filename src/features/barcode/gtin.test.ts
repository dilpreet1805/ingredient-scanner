import { describe, expect, it } from "vitest";

import { toGtin13 } from "./gtin";

describe("toGtin13", () => {
  it("keeps a valid EAN-13 as it is", () => {
    expect(toGtin13("ean13", "4006381333931")).toBe("4006381333931");
  });

  it("adds one leading zero to a UPC-A", () => {
    expect(toGtin13("upc_a", "036000291452")).toBe("0036000291452");
  });

  it("gives the same key for a UPC-A read as upc_a (Android) or as ean13 with a leading 0 (iPhone)", () => {
    expect(toGtin13("upc_a", "036000291452")).toBe(toGtin13("ean13", "0036000291452"));
  });

  it("adds five leading zeros to an EAN-8", () => {
    expect(toGtin13("ean8", "96385074")).toBe("0000096385074");
  });

  it.each([
    ["ean13", "4006381333932"],
    ["upc_a", "036000291453"],
    ["ean8", "96385075"],
  ])("rejects a wrong check digit (%s %s)", (format, code) => {
    expect(toGtin13(format, code)).toBeNull();
  });

  it.each([
    ["ean13", "036000291452"], // 12 digits sent as EAN-13
    ["upc_a", "4006381333931"], // 13 digits sent as UPC-A
    ["ean8", "036000291452"], // 12 digits sent as EAN-8
    ["ean8", "9638507"], // 7 digits
  ])("rejects the wrong length for the format (%s %s)", (format, code) => {
    expect(toGtin13(format, code)).toBeNull();
  });

  it.each([
    ["upc_e", "01234565"],
    ["qr", "4006381333931"],
    ["", "4006381333931"],
  ])("rejects unsupported formats (%s)", (format, code) => {
    expect(toGtin13(format, code)).toBeNull();
  });
});
