import { describe, expect, it } from "vitest";

import type { LabelReading } from "./label-reading";
import { basisLabel, nutritionRows } from "./nutrition-rows";
import { warningText } from "./warning-text";

type Panel = NonNullable<LabelReading["nutrition"]>;

const panel = (values: object, basis: Panel["basis"] = "per100g") =>
  ({ basis, values }) as unknown as Panel;

describe("nutritionRows", () => {
  it("lists only what was read, in a fixed order with units", () => {
    const rows = nutritionRows(
      panel({
        sodiumMg: { value: 51, lessThan: false },
        energyKcal: { value: 285.5, lessThan: false },
        proteinG: null,
      }),
    );
    expect(rows).toEqual([
      { label: "Energy", text: "285.5 kcal" },
      { label: "Sodium", text: "51 mg" },
    ]);
  });

  it("shows Trace for zero with less-than, and a less-than sign otherwise", () => {
    const rows = nutritionRows(
      panel({
        saturatedFatG: { value: 0, lessThan: true },
        fatG: { value: 0.5, lessThan: true },
      }),
    );
    expect(rows).toEqual([
      { label: "Total fat", text: "< 0.5 g" },
      { label: "Saturated fat", text: "Trace" },
    ]);
  });
});

describe("basisLabel", () => {
  it("names each basis, with the serving size when there is one", () => {
    expect(basisLabel(panel({}, "per100g"), null)).toBe("Per 100 g");
    expect(basisLabel(panel({}, "per100ml"), null)).toBe("Per 100 ml");
    expect(basisLabel(panel({}, "perServing"), null)).toBe("Per serving");
    expect(basisLabel(panel({}, "perServing"), "20 g (1 Tbsp)")).toBe(
      "Per serving (20 g (1 Tbsp))",
    );
  });
});

describe("warningText", () => {
  it("has plain wording for each known code", () => {
    for (const code of [
      "energy_mismatch",
      "values_out_of_range",
      "incomplete_nutrition",
      "sugar_inconsistent",
    ]) {
      expect(warningText(code)).not.toMatch(/may not be read/);
    }
  });

  it("falls back for a code this app doesn't know", () => {
    expect(warningText("something_new")).toMatch(/Check them against the pack/);
  });
});
