import { describe, expect, it } from "vitest";

import { suggestTargets, type TargetInput } from "./nutrition-targets";

const YEAR = 2026;

const base: TargetInput = {
  sex: "male",
  activity: "light",
  goal: "lose",
  birthYear: 1992, // 34 years old
  heightCm: 170,
  weightKg: 109.5,
};

describe("suggestTargets", () => {
  it("lowers calories for a weight-loss goal", () => {
    // BMR 1992.5 x 1.375 = 2739.7, minus 500 = 2239.7, rounded to 2240
    const result = suggestTargets(base, YEAR);
    expect(result).toMatchObject({
      status: "ok",
      goal: "lose",
      goals: { calories: 2240, proteinG: 140, carbsG: 252, fatG: 75 },
    });
  });

  it("uses maintenance calories for a maintain goal", () => {
    const result = suggestTargets({ ...base, goal: "maintain" }, YEAR);
    expect(result).toMatchObject({ status: "ok", goals: { calories: 2740 } });
  });

  it("estimates lower needs for a smaller, seated woman", () => {
    // BMR 1289 x 1.2 = 1546.8, rounded to 1550
    const result = suggestTargets(
      {
        sex: "female",
        activity: "sedentary",
        goal: "maintain",
        birthYear: 1996,
        heightCm: 160,
        weightKg: 60,
      },
      YEAR,
    );
    expect(result).toMatchObject({ status: "ok", goals: { calories: 1550 } });
  });

  it("does not suggest a deficit when BMI is underweight", () => {
    // BMI 17.6. Maintenance: BMR 1139 x 1.2 = 1366.8, rounded to 1370
    const result = suggestTargets(
      {
        sex: "female",
        activity: "sedentary",
        goal: "lose",
        birthYear: 1996,
        heightCm: 160,
        weightKg: 45,
      },
      YEAR,
    );
    expect(result).toMatchObject({
      status: "ok",
      goal: "maintain",
      notes: ["underweight-no-deficit"],
      goals: { calories: 1370 },
    });
  });

  it("never goes below the calorie floor", () => {
    // BMR 926.5 x 1.2 = 1111.8, below the 1200 floor
    const result = suggestTargets(
      {
        sex: "female",
        activity: "sedentary",
        goal: "maintain",
        birthYear: 1976,
        heightCm: 150,
        weightKg: 40,
      },
      YEAR,
    );
    expect(result).toMatchObject({
      status: "ok",
      notes: ["calorie-floor"],
      goals: { calories: 1200 },
    });
  });

  it("flags when sex is unspecified", () => {
    const result = suggestTargets({ ...base, sex: "unspecified" }, YEAR);
    expect(result).toMatchObject({ status: "ok", notes: ["sex-unspecified"] });
  });

  it("gives no suggestion under 18", () => {
    expect(suggestTargets({ ...base, birthYear: 2012 }, YEAR)).toEqual({
      status: "unavailable",
      reason: "under-18",
    });
  });
});
