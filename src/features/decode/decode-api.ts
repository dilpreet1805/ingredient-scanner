import { z } from "zod";

import { SessionNotAllowedError } from "../../lib/session-manager";
import { labelReadingSchema, type LabelReading } from "./label-reading";

export type MediaType = "image/jpeg" | "image/png" | "image/webp";
export type DecodePayload = { image: string; mediaType: MediaType };
export type Missing = "ingredients" | "nutrition";
export type Quota = {
  used: number | null;
  limit: number | null;
  subscriber: boolean | null;
};

/** Every outcome the screens must handle. Expected failures are values, never exceptions. */
export type DecodeResult =
  | {
      kind: "read";
      reading: LabelReading;
      missing: Missing[];
      warnings: string[];
      quota: Quota;
    }
  | { kind: "not_a_label" }
  | { kind: "daily_limit"; limit: number | null; subscriber: boolean }
  | { kind: "capacity" } // the service's daily free allowance is used up
  | { kind: "unavailable" } // our server or the AI failed: try again later
  | { kind: "rejected" } // the server refused the photo itself (bad type, too large)
  | { kind: "auth" } // the session was refused, even after a refresh
  | { kind: "offline" } // no connection, a timeout, or no session could be started
  | { kind: "invalid_response" }; // the server replied, but not in the shape we expect

const quotaSchema = z.object({
  used: z.number().optional(),
  limit: z.number().optional(),
  subscriber: z.boolean().optional(),
});

const readSchema = z.object({
  ok: z.literal(true),
  reading: labelReadingSchema,
  missing: z.array(z.enum(["ingredients", "nutrition"])),
  warnings: z.array(z.string()),
  quota: quotaSchema.optional(),
});

const notLabelSchema = z.object({
  ok: z.literal(false),
  reason: z.literal("not_a_label"),
});

const limitSchema = z.object({
  error: z.literal("daily_limit"),
  limit: z.number().optional(),
  subscriber: z.boolean().optional(),
});

const capacitySchema = z.object({ error: z.literal("capacity") });

type RawReply = { status: number; body: unknown };

function interpret({ status, body }: RawReply): DecodeResult {
  if (status === 200) {
    const read = readSchema.safeParse(body);
    if (read.success) {
      const q = read.data.quota;
      return {
        kind: "read",
        reading: read.data.reading,
        missing: read.data.missing,
        warnings: read.data.warnings,
        quota: {
          used: q?.used ?? null,
          limit: q?.limit ?? null,
          subscriber: q?.subscriber ?? null,
        },
      };
    }
    if (notLabelSchema.safeParse(body).success) return { kind: "not_a_label" };
    return { kind: "invalid_response" };
  }

  if (status === 429) {
    const limit = limitSchema.safeParse(body);
    if (limit.success) {
      return {
        kind: "daily_limit",
        limit: limit.data.limit ?? null,
        subscriber: limit.data.subscriber ?? false,
      };
    }
    return { kind: "unavailable" };
  }

  if (status === 503 && capacitySchema.safeParse(body).success)
    return { kind: "capacity" };
  if (status === 400 || status === 405 || status === 413)
    return { kind: "rejected" };
  if (status === 401 || status === 403) return { kind: "auth" };
  return { kind: "unavailable" };
}

export type DecodeClientDeps = {
  endpoint: string;
  publishableKey: string;
  getToken: () => Promise<string>;
  refreshToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export function createDecodeClient(deps: DecodeClientDeps) {
  const doFetch = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? 60_000;

  async function attempt(
    payload: DecodePayload,
    token: string,
  ): Promise<RawReply | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await doFetch(deps.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: deps.publishableKey,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        if (controller.signal.aborted) return null; // timed out while reading the reply
      }
      return { status: response.status, body };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return async function decodeLabel(
    payload: DecodePayload,
  ): Promise<DecodeResult> {
    let token: string;
    try {
      token = await deps.getToken();
    } catch (error) {
      // A session requested before the age check is a bug in our code. Never hide it.
      if (error instanceof SessionNotAllowedError) throw error;
      return { kind: "offline" };
    }

    let reply = await attempt(payload, token);
    if (reply === null) return { kind: "offline" };

    if (reply.status === 401) {
      // The token may have expired: refresh it and retry exactly once.
      const fresh = await deps.refreshToken().catch(() => null);
      if (fresh) {
        reply = await attempt(payload, fresh);
        if (reply === null) return { kind: "offline" };
      }
    }

    return interpret(reply);
  };
}
