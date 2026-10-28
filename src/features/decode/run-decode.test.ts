import { describe, expect, it, vi } from "vitest";

import type { DecodeResult } from "./decode-api";
import { runDecode, type RunDeps } from "./run-decode";

const photo = {
  uri: "file:///prepared.jpg",
  base64: "AAAA",
  mediaType: "image/jpeg",
  width: 1200,
  height: 1600,
};

function deps(overrides: { prepare?: unknown; decode?: unknown }): RunDeps {
  return {
    prepare: overrides.prepare ?? vi.fn(async () => ({ ok: true, photo })),
    decode: overrides.decode ?? vi.fn(async () => ({ kind: "not_a_label" })),
  } as unknown as RunDeps;
}

const readResult = {
  kind: "read",
  reading: { isFoodLabel: true },
  missing: [],
  warnings: [],
  quota: { used: 1, limit: 20, subscriber: false },
} as unknown as DecodeResult;

describe("runDecode", () => {
  it("returns the read result with the photo that was sent", async () => {
    const out = await runDecode(
      "file:///raw.jpg",
      deps({ decode: async () => readResult }),
    );
    expect(out.kind).toBe("read");
    if (out.kind === "read") expect(out.photoUri).toBe("file:///prepared.jpg");
  });

  it("sends the prepared image and media type", async () => {
    const decode = vi.fn(async () => readResult);
    await runDecode("file:///raw.jpg", deps({ decode }));
    expect(decode).toHaveBeenCalledWith({
      image: "AAAA",
      mediaType: "image/jpeg",
    });
  });

  it("passes failures through unchanged", async () => {
    const out = await runDecode("file:///raw.jpg", deps({}));
    expect(out).toEqual({ kind: "not_a_label" });
  });

  it("returns rejected, and never calls the server, when the photo can't be prepared", async () => {
    const decode = vi.fn();
    const failed = await runDecode(
      "file:///raw.jpg",
      deps({
        prepare: async () => ({ ok: false, reason: "too small" }),
        decode,
      }),
    );
    expect(failed).toEqual({ kind: "rejected" });

    const threw = await runDecode(
      "file:///raw.jpg",
      deps({
        prepare: async () => {
          throw new Error("no file");
        },
        decode,
      }),
    );
    expect(threw).toEqual({ kind: "rejected" });
    expect(decode).not.toHaveBeenCalled();
  });
});
