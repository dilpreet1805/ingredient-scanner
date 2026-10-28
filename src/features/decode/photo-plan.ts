/** Must stay below the server's limit (MAX_IMAGE_B64_CHARS = 3,000,000 in the function). */
export const MAX_UPLOAD_CHARS = 2_800_000;

export type Attempt = { maxEdge: number; quality: number };

/** Tried in order until the photo fits. Each attempt is smaller than the one before. */
export const ATTEMPTS: readonly Attempt[] = [
  { maxEdge: 1600, quality: 0.7 },
  { maxEdge: 1600, quality: 0.5 },
  { maxEdge: 1280, quality: 0.5 },
  { maxEdge: 1024, quality: 0.4 },
];

/** Shrinks by the longer side only, so the shape is kept. Returns null if no resize is needed. */
export function planResize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number } | { height: number } | null {
  const valid = [width, height, maxEdge].every(
    (n) => Number.isFinite(n) && n > 0,
  );
  if (!valid) return null;
  if (Math.max(width, height) <= maxEdge) return null; // never enlarge a photo
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}

export type RenderResult = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};
export type PreparedPhoto = RenderResult & { mediaType: "image/jpeg" };

export type PrepareResult =
  | { ok: true; photo: PreparedPhoto }
  | { ok: false; reason: "too_large" | "failed" };

/** Tries each attempt until the result fits the upload limit. */
export async function prepareWithFallback(
  render: (attempt: Attempt) => Promise<RenderResult>,
  attempts: readonly Attempt[] = ATTEMPTS,
): Promise<PrepareResult> {
  for (const attempt of attempts) {
    let rendered: RenderResult;
    try {
      rendered = await render(attempt);
    } catch {
      return { ok: false, reason: "failed" };
    }
    if (rendered.base64.length === 0) return { ok: false, reason: "failed" };
    if (rendered.base64.length <= MAX_UPLOAD_CHARS) {
      return { ok: true, photo: { ...rendered, mediaType: "image/jpeg" } };
    }
  }
  return { ok: false, reason: "too_large" };
}
