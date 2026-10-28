import { describe, expect, it } from "vitest";

import { outcomeMessage, type FailedDecode } from "./outcome-message";

const kinds: FailedDecode["kind"][] = [
  "not_a_label",
  "daily_limit",
  "capacity",
  "unavailable",
  "rejected",
  "auth",
  "offline",
  "invalid_response",
];

describe("outcomeMessage", () => {
  it.each(kinds)("has a title and a body for %s", (kind) => {
    const message = outcomeMessage({ kind } as FailedDecode);
    expect(message.title.length).toBeGreaterThan(0);
    expect(message.body.length).toBeGreaterThan(0);
  });

  it("offers a retake only when a new photo can help", () => {
    const retake = kinds.filter(
      (kind) => outcomeMessage({ kind } as FailedDecode).canRetake,
    );
    expect(retake.sort()).toEqual([
      "invalid_response",
      "not_a_label",
      "rejected",
    ]);
  });
});
