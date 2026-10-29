import { describe, expect, it } from "vitest";

import { ean13CheckDigit, isValidEan13 } from "./ean13";

describe("ean13CheckDigit", () => {
  it.each([
    ["400638133393", 1],
    ["590123412345", 7],
    ["890123456789", 0], // sum is 130: the outer mod 10 turns 10 into 0
  ] as const)("%s -> %i", (first12, check) => {
    expect(ean13CheckDigit(first12)).toBe(check);
  });

  it("returns null unless the input is exactly 12 digits", () => {
    for (const bad of ["", "40063813339", "4006381333931", "40063813339a", " 40063813339"]) {
      expect(ean13CheckDigit(bad)).toBeNull();
    }
  });
});

describe("isValidEan13", () => {
  it("accepts codes with a correct check digit", () => {
    expect(isValidEan13("4006381333931")).toBe(true);
    expect(isValidEan13("5901234123457")).toBe(true);
    expect(isValidEan13("8901234567890")).toBe(true);
  });

  it("rejects a wrong check digit", () => {
    expect(isValidEan13("4006381333932")).toBe(false);
  });

  it("catches every single-digit misread", () => {
    const valid = "4006381333931";
    for (let pos = 0; pos < 13; pos++) {
      for (let d = 0; d <= 9; d++) {
        if (String(d) === valid[pos]) continue;
        const misread = valid.slice(0, pos) + d + valid.slice(pos + 1);
        expect(isValidEan13(misread)).toBe(false);
      }
    }
  });

  it("does not catch swapping neighbours that differ by 5 (known limit)", () => {
    // 3 and 8 swapped at positions 5 and 6: the sum changes by exactly 10.
    expect(isValidEan13("4006831333931")).toBe(true);
  });

  it("rejects wrong length or non-digits", () => {
    for (const bad of [
      "",
      "400638133393",
      "40063813339310",
      " 4006381333931",
      "4006381333931 ",
      "400638133393a",
      "4006-38133393",
    ]) {
      expect(isValidEan13(bad)).toBe(false);
    }
  });
});
