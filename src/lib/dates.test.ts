import { describe, expect, it } from "vitest";

import { addDays, startOfWeek, toDateKey, weekDays } from "./dates";

describe("dates", () => {
  it("formats a local date", () => {
    expect(toDateKey(new Date(2026, 9, 26))).toBe("2026-10-26");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the Monday that starts a week", () => {
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26"); // Monday
    expect(startOfWeek("2026-10-28")).toBe("2026-10-26"); // Wednesday
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26"); // Sunday
  });

  it("lists seven days from Monday to Sunday", () => {
    const days = weekDays("2026-10-28");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-10-26");
    expect(days[6]).toBe("2026-11-01");
  });
});
