import { describe, expect, it } from "vitest";

import { SessionNotAllowedError } from "../../lib/session-manager";
import { createDecodeClient, type DecodePayload } from "./decode-api";

const payload: DecodePayload = { image: "AAAA", mediaType: "image/jpeg" };

const emptyNutrients = {
  energyKcal: null,
  proteinG: null,
  carbsG: null,
  totalSugarG: null,
  addedSugarG: null,
  polyolG: null,
  fibreG: null,
  fatG: null,
  saturatedFatG: null,
  transFatG: null,
  cholesterolMg: null,
  sodiumMg: null,
};

const reading = {
  isFoodLabel: true,
  brand: "Brand",
  productName: "Product",
  category: "sauce",
  ingredientsText: "Water, Salt",
  allergenStatements: [],
  servingSize: "13g",
  servingsPerPack: 14,
  nutrition: {
    basis: "per100g",
    values: { ...emptyNutrients, energyKcal: { value: 25, lessThan: false } },
  },
};

const reply = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function makeClient(
  fetchImpl: (url: string, init: RequestInit) => Promise<Response>,
  overrides: Partial<Parameters<typeof createDecodeClient>[0]> = {},
) {
  return createDecodeClient({
    endpoint: "https://example.test/functions/v1/decode-label",
    publishableKey: "pk",
    getToken: async () => "token-1",
    refreshToken: async () => "token-2",
    fetchImpl: fetchImpl as unknown as typeof fetch,
    ...overrides,
  });
}

describe("decodeLabel", () => {
  it("returns a reading", async () => {
    const decode = makeClient(
      reply(200, {
        ok: true,
        reading,
        missing: [],
        warnings: [],
        quota: { used: 1, limit: 20, subscriber: false },
      }),
    );
    const result = await decode(payload);
    expect(result.kind).toBe("read");
    if (result.kind === "read") {
      expect(result.reading.productName).toBe("Product");
      expect(result.quota).toEqual({ used: 1, limit: 20, subscriber: false });
    }
  });

  it("recognizes a photo that is not a label", async () => {
    const decode = makeClient(reply(200, { ok: false, reason: "not_a_label" }));
    expect(await decode(payload)).toEqual({ kind: "not_a_label" });
  });

  it("reports the daily limit", async () => {
    const decode = makeClient(
      reply(429, { error: "daily_limit", limit: 20, subscriber: false }),
    );
    expect(await decode(payload)).toEqual({
      kind: "daily_limit",
      limit: 20,
      subscriber: false,
    });
  });

  it("reports capacity", async () => {
    const decode = makeClient(reply(503, { error: "capacity" }));
    expect(await decode(payload)).toEqual({ kind: "capacity" });
  });

  it.each([500, 502, 503])("treats %i as unavailable", async (status) => {
    const decode = makeClient(reply(status, { error: "Service unavailable" }));
    expect(await decode(payload)).toEqual({ kind: "unavailable" });
  });

  it.each([400, 405, 413])(
    "treats %i as a rejected request",
    async (status) => {
      const decode = makeClient(reply(status, { error: "Invalid image data" }));
      expect(await decode(payload)).toEqual({ kind: "rejected" });
    },
  );

  it("refreshes the token once after a 401 and retries", async () => {
    const tokens: string[] = [];
    const decode = makeClient(async (_url, init) => {
      const auth = (init.headers as Record<string, string>).Authorization;
      tokens.push(auth);
      return tokens.length === 1
        ? new Response("{}", { status: 401 })
        : new Response(JSON.stringify({ ok: false, reason: "not_a_label" }), {
            status: 200,
          });
    });
    expect(await decode(payload)).toEqual({ kind: "not_a_label" });
    expect(tokens).toEqual(["Bearer token-1", "Bearer token-2"]);
  });

  it("gives up after a second 401 without looping", async () => {
    let calls = 0;
    let refreshes = 0;
    const decode = makeClient(
      async () => {
        calls += 1;
        return new Response("{}", { status: 401 });
      },
      {
        refreshToken: async () => {
          refreshes += 1;
          return "token-2";
        },
      },
    );
    expect(await decode(payload)).toEqual({ kind: "auth" });
    expect(calls).toBe(2);
    expect(refreshes).toBe(1);
  });

  it("reports offline when the network fails", async () => {
    const decode = makeClient(async () => {
      throw new TypeError("Network request failed");
    });
    expect(await decode(payload)).toEqual({ kind: "offline" });
  });

  it("reports offline when the request times out", async () => {
    const decode = makeClient(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
      { timeoutMs: 20 },
    );
    expect(await decode(payload)).toEqual({ kind: "offline" });
  });

  it("reports an invalid response for an unexpected 200 body", async () => {
    const decode = makeClient(reply(200, { hello: "world" }));
    expect(await decode(payload)).toEqual({ kind: "invalid_response" });
  });

  it("reports an invalid response when the body is not JSON", async () => {
    const decode = makeClient(
      async () => new Response("oops", { status: 200 }),
    );
    expect(await decode(payload)).toEqual({ kind: "invalid_response" });
  });

  it("reports offline when no session can be started", async () => {
    const decode = makeClient(reply(200, {}), {
      getToken: async () => {
        throw new Error("network");
      },
    });
    expect(await decode(payload)).toEqual({ kind: "offline" });
  });

  it("does not hide a session requested before the age check", async () => {
    const decode = makeClient(reply(200, {}), {
      getToken: async () => {
        throw new SessionNotAllowedError("too early");
      },
    });
    await expect(decode(payload)).rejects.toBeInstanceOf(
      SessionNotAllowedError,
    );
  });

  it("sends the key, the token and the photo", async () => {
    let seen: RequestInit | undefined;
    const decode = makeClient(async (_url, init) => {
      seen = init;
      return new Response(
        JSON.stringify({ ok: false, reason: "not_a_label" }),
        { status: 200 },
      );
    });
    await decode(payload);
    const headers = seen?.headers as Record<string, string>;
    expect(seen?.method).toBe("POST");
    expect(headers.apikey).toBe("pk");
    expect(headers.Authorization).toBe("Bearer token-1");
    expect(JSON.parse(String(seen?.body))).toEqual(payload);
  });
});
