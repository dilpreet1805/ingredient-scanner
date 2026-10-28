import { describe, expect, it } from "vitest";

import { calculateAge, partsFromDate, tierForAge } from "./age-policy";

const today = { year: 2026, month: 10, day: 27 };

describe("tierForAge", () => {
  it.each([
    [0, "blocked"],
    [10, "blocked"],
    [11, "teen"],
    [17, "teen"],
    [18, "adult"],
    [65, "adult"],
  ] as const)("age %i is %s", (age, tier) => {
    expect(tierForAge(age)).toBe(tier);
  });
});

describe("calculateAge", () => {
  it("counts a birthday that is today", () => {
    expect(calculateAge({ year: 2008, month: 10, day: 27 }, today)).toEqual({
      ok: true,
      age: 18,
    });
  });

  it("does not count a birthday that is tomorrow", () => {
    expect(calculateAge({ year: 2008, month: 10, day: 28 }, today)).toEqual({
      ok: true,
      age: 17,
    });
  });

  it("treats a February 29 birthday as reached on March 1 in other years", () => {
    const born = { year: 2008, month: 2, day: 29 };
    expect(calculateAge(born, { year: 2026, month: 2, day: 28 })).toEqual({
      ok: true,
      age: 17,
    });
    expect(calculateAge(born, { year: 2026, month: 3, day: 1 })).toEqual({
      ok: true,
      age: 18,
    });
  });

  it("accepts someone born today", () => {
    expect(calculateAge(today, today)).toEqual({ ok: true, age: 0 });
  });

  it("rejects impossible dates", () => {
    const bad = [
      { year: 2023, month: 2, day: 29 },
      { year: 2026, month: 2, day: 30 },
      { year: 2000, month: 13, day: 1 },
      { year: 2000, month: 0, day: 1 },
      { year: 2000, month: 5, day: 0 },
      { year: 2000, month: 4, day: 31 },
      { year: 1899, month: 1, day: 1 },
      { year: 2000.5, month: 1, day: 1 },
    ];
    for (const birth of bad) {
      expect(calculateAge(birth, today)).toEqual({
        ok: false,
        reason: "invalid_date",
      });
    }
  });

  it("accepts real leap days only", () => {
    expect(calculateAge({ year: 2004, month: 2, day: 29 }, today).ok).toBe(
      true,
    );
    expect(calculateAge({ year: 1900, month: 2, day: 29 }, today).ok).toBe(
      false,
    );
  });

  it("rejects a date in the future", () => {
    expect(calculateAge({ year: 2026, month: 10, day: 28 }, today)).toEqual({
      ok: false,
      reason: "future_date",
    });
    expect(calculateAge({ year: 2030, month: 1, day: 1 }, today).ok).toBe(
      false,
    );
  });

  it("rejects an implausible age", () => {
    expect(calculateAge({ year: 1900, month: 1, day: 1 }, today)).toEqual({
      ok: false,
      reason: "too_old",
    });
  });
});

describe("partsFromDate", () => {
  it("uses the local calendar date", () => {
    expect(partsFromDate(new Date(2026, 9, 27, 23, 59))).toEqual({
      year: 2026,
      month: 10,
      day: 27,
    });
  });
});
