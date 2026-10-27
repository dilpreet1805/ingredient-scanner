import { describe, expect, it } from "vitest";

import { createChunkedStorage, type KeyValueBackend } from "./chunked-storage";

function memoryBackend() {
  const data = new Map<string, string>();
  const backend: KeyValueBackend = {
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
    },
    remove: async (key) => {
      data.delete(key);
    },
  };
  return { backend, data };
}

describe("chunked storage", () => {
  it("round-trips a short value", async () => {
    const { backend } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem("session", "hello");
    expect(await storage.getItem("session")).toBe("hello");
  });

  it("splits a long value into small parts and round-trips it", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    const long = "abc123".repeat(1000); // 6000 characters
    await storage.setItem("session", long);
    expect(await storage.getItem("session")).toBe(long);
    for (const [key, part] of data) {
      if (!key.endsWith(".count")) expect(part.length).toBeLessThanOrEqual(601);
    }
  });

  it("leaves no old parts behind when a value is replaced by a shorter one", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem("k", "x".repeat(3000));
    await storage.setItem("k", "short");
    expect([...data.keys()].sort()).toEqual(["k.0", "k.count"]);
    expect(await storage.getItem("k")).toBe("short");
  });

  it("removes everything when an item is removed", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem("k", "x".repeat(3000));
    await storage.removeItem("k");
    expect(data.size).toBe(0);
    expect(await storage.getItem("k")).toBeNull();
  });

  it("reads a value with a missing part as no value", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem("k", "x".repeat(3000));
    data.delete("k.2");
    expect(await storage.getItem("k")).toBeNull();
  });

  it("reads a corrupt count as no value", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    data.set("k.0", "abc");
    for (const bad of ["abc", "0", "-1", "1.5", "101"]) {
      data.set("k.count", bad);
      expect(await storage.getItem("k")).toBeNull();
    }
  });

  it("treats an interrupted write as no value", async () => {
    const { backend } = memoryBackend();
    let writes = 0;
    const flaky: KeyValueBackend = {
      ...backend,
      set: async (key, value) => {
        writes += 1;
        if (writes === 3) throw new Error("disk full");
        await backend.set(key, value);
      },
    };
    const storage = createChunkedStorage(flaky);
    await expect(storage.setItem("k", "x".repeat(2000))).rejects.toThrow(
      "disk full",
    );
    expect(await storage.getItem("k")).toBeNull();
  });

  it("does not cut an emoji in half at a part boundary", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    const text = "a".repeat(599) + "😀" + "b".repeat(10);
    await storage.setItem("k", text);
    expect(await storage.getItem("k")).toBe(text);
    for (const [key, part] of data) {
      // encodeURIComponent throws on a lone surrogate half.
      if (!key.endsWith(".count"))
        expect(() => encodeURIComponent(part)).not.toThrow();
    }
  });

  it("treats storing an empty value as removing it", async () => {
    const { backend, data } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await storage.setItem("k", "something");
    await storage.setItem("k", "");
    expect(data.size).toBe(0);
    expect(await storage.getItem("k")).toBeNull();
  });

  it("refuses a value that is too large", async () => {
    const { backend } = memoryBackend();
    const storage = createChunkedStorage(backend);
    await expect(
      storage.setItem("k", "x".repeat(100 * 600 + 1)),
    ).rejects.toThrow("too large");
  });
});
