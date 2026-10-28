import type { DecodeResult } from "./decode-api";
import type { decodeLabel } from "./decode-client";
import type { FailedDecode } from "./outcome-message";
import type { prepareLabelPhoto } from "./prepare-photo";

export type ReadResult = Extract<DecodeResult, { kind: "read" }>;

// A successful read also carries the photo that was actually sent,
// so the review screen can show it next to the numbers.
export type RunOutcome = (ReadResult & { photoUri: string }) | FailedDecode;

// Passed in, so tests can use fakes and never touch the network.
export type RunDeps = {
  prepare: typeof prepareLabelPhoto;
  decode: typeof decodeLabel;
};

export async function runDecode(
  uri: string,
  deps: RunDeps,
): Promise<RunOutcome> {
  let prepared: Awaited<ReturnType<RunDeps["prepare"]>>;
  try {
    prepared = await deps.prepare(uri);
  } catch {
    return { kind: "rejected" }; // the file could not be opened or resized
  }
  if (!prepared.ok) return { kind: "rejected" };

  const { photo } = prepared;
  // Not wrapped in try/catch: a session error is a bug in our code and must stay visible.
  const result = await deps.decode({
    image: photo.base64,
    mediaType: photo.mediaType,
  });

  if (result.kind !== "read") return result;
  return { ...result, photoUri: photo.uri };
}
