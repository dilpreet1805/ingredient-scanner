import { describe, expect, it } from "vitest";

import {
    ATTEMPTS,
    MAX_UPLOAD_CHARS,
    planResize,
    prepareWithFallback,
    type Attempt,
    type RenderResult,
} from "./photo-plan";

const rendered = (chars: number): RenderResult => ({
  uri: "file:///prepared.jpg",
  base64: "A".repeat(chars),
  width: 1200,
  height: 1600,
});

describe("planResize", () => {
  it("shrinks a wide photo by its width", () => {
    expect(planResize(4000, 3000, 1600)).toEqual({ width: 1600 });
  });

  it("shrinks a tall photo by its height", () => {
    expect(planResize(3000, 4000, 1600)).toEqual({ height: 1600 });
  });

  it("shrinks a square photo", () => {
    expect(planResize(3000, 3000, 1600)).toEqual({ width: 1600 });
  });

  it("leaves a photo that is already small enough", () => {
    expect(planResize(1200, 800, 1600)).toBeNull();
    expect(planResize(1600, 1200, 1600)).toBeNull();
  });

  it("gives no plan for impossible sizes", () => {
    expect(planResize(0, 100, 1600)).toBeNull();
    expect(planResize(-5, 100, 1600)).toBeNull();
    expect(planResize(Number.NaN, 100, 1600)).toBeNull();
    expect(planResize(100, 100, 0)).toBeNull();
  });
});

describe("prepareWithFallback", () => {
  it("uses the first attempt when it fits", async () => {
    const calls: Attempt[] = [];
    const result = await prepareWithFallback(async (attempt) => {
      calls.push(attempt);
      return rendered(1000);
    });
    expect(result.ok).toBe(true);
    expect(calls).toEqual([ATTEMPTS[0]]);
    if (result.ok) expect(result.photo.mediaType).toBe("image/jpeg");
  });

  it("falls back to a smaller attempt when the first is too big", async () => {
    const calls: Attempt[] = [];
    const result = await prepareWithFallback(async (attempt) => {
      calls.push(attempt);
      return rendered(calls.length === 1 ? MAX_UPLOAD_CHARS + 1 : 1000);
    });
    expect(result.ok).toBe(true);
    expect(calls).toEqual([ATTEMPTS[0], ATTEMPTS[1]]);
  });

  it("gives up when nothing fits", async () => {
    let calls = 0;
    const result = await prepareWithFallback(async () => {
      calls += 1;
      return rendered(MAX_UPLOAD_CHARS + 1);
    });
    expect(result).toEqual({ ok: false, reason: "too_large" });
    expect(calls).toBe(ATTEMPTS.length);
  });

  it("reports a failure when rendering throws", async () => {
    let calls = 0;
    const result = await prepareWithFallback(async () => {
      calls += 1;
      throw new Error("out of memory");
    });
    expect(result).toEqual({ ok: false, reason: "failed" });
    expect(calls).toBe(1);
  });

  it("treats an empty result as a failure", async () => {
    const result = await prepareWithFallback(async () => rendered(0));
    expect(result).toEqual({ ok: false, reason: "failed" });
  });
});

describe("limits", () => {
  it("stays under the server's limit", () => {
    expect(MAX_UPLOAD_CHARS).toBeLessThan(3_000_000);
  });

  it("makes each attempt no larger than the one before", () => {
    for (let i = 1; i < ATTEMPTS.length; i++) {
      expect(ATTEMPTS[i].maxEdge).toBeLessThanOrEqual(ATTEMPTS[i - 1].maxEdge);
      expect(ATTEMPTS[i].quality).toBeLessThanOrEqual(ATTEMPTS[i - 1].quality);
    }
  });
});
