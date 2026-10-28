import { describe, expect, it } from "vitest";

import type { KeyValueBackend } from "../../lib/chunked-storage";
import { createAgeRepository } from "./age-repository";

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

const adultYear = new Date().getFullYear() - 30;

describe("age repository", () => {
  it("round-trips an adult with a birth year", async () => {
    const { backend } = memoryBackend();
    const repository = createAgeRepository(backend);
    await repository.write({ tier: "adult", birthYear: adultYear });
    expect(await repository.read()).toEqual({
      tier: "adult",
      birthYear: adultYear,
    });
  });

  it.each(["teen", "blocked"] as const)(
    "round-trips %s without a birth year",
    async (tier) => {
      const { backend } = memoryBackend();
      const repository = createAgeRepository(backend);
      await repository.write({ tier, birthYear: 2012 });
      expect(await repository.read()).toEqual({ tier, birthYear: null });
    },
  );

  it("returns null when nothing is saved", async () => {
    const { backend } = memoryBackend();
    expect(await createAgeRepository(backend).read()).toBeNull();
  });

  it("ignores text that is not JSON", async () => {
    const { backend, data } = memoryBackend();
    data.set("age-record", "adult");
    expect(await createAgeRepository(backend).read()).toBeNull();
  });

  it("ignores an unknown tier", async () => {
    const { backend, data } = memoryBackend();
    data.set(
      "age-record",
      JSON.stringify({ tier: "grandparent", birthYear: adultYear }),
    );
    expect(await createAgeRepository(backend).read()).toBeNull();
  });

  it("ignores an adult record without a plausible birth year", async () => {
    const { backend, data } = memoryBackend();
    const repository = createAgeRepository(backend);
    const bad = [
      { tier: "adult" },
      { tier: "adult", birthYear: 1800 },
      { tier: "adult", birthYear: 2.5 },
      { tier: "adult", birthYear: "1990" },
      { tier: "adult", birthYear: new Date().getFullYear() + 1 },
    ];
    for (const record of bad) {
      data.set("age-record", JSON.stringify(record));
      expect(await repository.read()).toBeNull();
    }
  });

  it("drops a birth year found on a teen or blocked record", async () => {
    const { backend, data } = memoryBackend();
    data.set("age-record", JSON.stringify({ tier: "teen", birthYear: 2012 }));
    expect(await createAgeRepository(backend).read()).toEqual({
      tier: "teen",
      birthYear: null,
    });
  });

  it("clears the saved value", async () => {
    const { backend, data } = memoryBackend();
    const repository = createAgeRepository(backend);
    await repository.write({ tier: "adult", birthYear: adultYear });
    await repository.clear();
    expect(data.size).toBe(0);
  });

  it("returns null when storage cannot be read", async () => {
    const broken: KeyValueBackend = {
      get: async () => {
        throw new Error("storage failed");
      },
      set: async () => {},
      remove: async () => {},
    };
    expect(await createAgeRepository(broken).read()).toBeNull();
  });
});
