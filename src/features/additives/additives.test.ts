import { describe, expect, it } from "vitest";

import { findAdditiveCodes, normalizeCode } from "./additive-codes";
import { ADDITIVES, lookupAdditive, type Source, type Statement } from "./additive-table";
import { describeAdditives } from "./describe-additives";

const DR_OETKER_INGREDIENTS =
  "Water, Refined Soyabean Oil, Sugar, Thickeners (INS1442, INS1422, INS1450, INS415), Mixed Spices (2.3%), Iodised Salt, Milk Solids, Edible Starch, Maltodextrin, Acidity Regulators (INS330, INS260), Black Salt, Lemon Juice Powder, Hydrolysed Vegetable Protein, Preservatives (INS211, INS202), Nature-Identical Flavouring Substances, Flavour Enhancer (INS635), Anticaking Agent (INS551), Antioxidant (INS319), Sequestrant (INS385), Spice Extracts. Contains permitted natural colour [INS160c(i)]";

describe("normalizeCode", () => {
  it("writes every common form the same way", () => {
    for (const raw of ["INS 160c(i)", "INS160c (i)", "E160c(i)", "ins-160C(I)", " 160c(i) "]) {
      expect(normalizeCode(raw)).toBe("160c(i)");
    }
    expect(normalizeCode("INS 1442")).toBe("1442");
    expect(normalizeCode("E330")).toBe("330");
    expect(normalizeCode("INS 553 (iii)")).toBe("553(iii)");
  });

  it("rejects text that is not a code", () => {
    for (const raw of ["", "salt", "INS", "12", "INS 12345", "2.3%"]) {
      expect(normalizeCode(raw)).toBeNull();
    }
  });
});

describe("findAdditiveCodes", () => {
  it("finds all 13 codes on the Dr. Oetker label, in order", () => {
    expect(findAdditiveCodes(DR_OETKER_INGREDIENTS)).toEqual([
      "1442", "1422", "1450", "415", "330", "260", "211", "202", "635", "551", "319", "385", "160c(i)",
    ]);
  });

  it("finds bare numbers that follow a code in the same list", () => {
    expect(findAdditiveCodes("Artificial Colour [INS 104, INS 133 & 172 (i)]")).toEqual(["104", "133", "172(i)"]);
    expect(findAdditiveCodes("Coating Agents (INS 462 & INS 464)")).toEqual(["462", "464"]);
  });

  it("reads E numbers and lists each code once", () => {
    expect(findAdditiveCodes("Acid (E330), Colour (E 102), Acid (E330)")).toEqual(["330", "102"]);
  });

  it("ignores numbers that are not codes", () => {
    expect(findAdditiveCodes("Mixed Spices (2.3%), Sugar 60%, Vitamin E, Salt 1.2 g")).toEqual([]);
    expect(findAdditiveCodes("")).toEqual([]);
  });
});

describe("describeAdditives", () => {
  it("gives the entry for known codes and null for unknown ones", () => {
    const found = describeAdditives("Colour (INS 160c(i)), Humectant (INS 1518)");
    expect(found.map((f) => f.code)).toEqual(["160c(i)", "1518"]);
    expect(found[0].entry?.name).toBe("Paprika colour");
    expect(found[1].entry).toBeNull();
  });
});

describe("the additive table", () => {
  const today = new Date().toISOString().slice(0, 10);

  const statementsOf = (entry: (typeof ADDITIVES)[number]): Statement[] => [
    entry.purpose,
    ...entry.rules,
    ...entry.awareness,
  ];

  it("covers the 17 codes we have sourced, each once", () => {
    const codes = ADDITIVES.map((entry) => entry.code).sort();
    expect(codes).toEqual(
      ["1201", "1422", "1442", "1450", "160c(i)", "122", "202", "211", "260", "319", "330", "385", "415", "460(i)", "551", "553(iii)", "635"].sort(),
    );
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("stores every code in its written form, and can look it up", () => {
    for (const entry of ADDITIVES) {
      expect(normalizeCode(entry.code)).toBe(entry.code);
      expect(lookupAdditive(entry.code)).toBe(entry);
    }
  });

  it("gives every statement text and at least one source", () => {
    for (const entry of ADDITIVES) {
      expect(entry.name.length, entry.code).toBeGreaterThan(0);
      expect(entry.group.length, entry.code).toBeGreaterThan(0);
      for (const statement of statementsOf(entry)) {
        expect(statement.text.trim().length, entry.code).toBeGreaterThan(0);
        expect(statement.sources.length, `${entry.code}: ${statement.text}`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every source a title, a web address and a real checked-on date", () => {
    const sources: Source[] = ADDITIVES.flatMap((entry) => statementsOf(entry).flatMap((s) => s.sources));
    for (const source of sources) {
      expect(source.title.trim().length).toBeGreaterThan(0);
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false);
      expect(source.checkedOn <= today).toBe(true);
    }
  });

  it("never gives a verdict of our own", () => {
    // We report what a regulator or expert body said. We never say a thing is safe, harmful or good.
    const verdict = /\b(safe|unsafe|harmful|harmless|toxic|dangerous|poison\w*|carcinogenic|healthy|unhealthy|good|bad|avoid)\b/i;
    for (const entry of ADDITIVES) {
      for (const statement of statementsOf(entry)) {
        expect(statement.text, `${entry.code}: ${statement.text}`).not.toMatch(verdict);
      }
    }
  });
});
