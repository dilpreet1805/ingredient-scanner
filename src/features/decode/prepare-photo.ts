import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import {
    planResize,
    prepareWithFallback,
    type PrepareResult,
} from "./photo-plan";

/**
 * Turns a photo from the camera or gallery into a JPEG small enough to upload.
 * Loading the photo applies its own orientation, so text arrives the right way up.
 */
export async function prepareLabelPhoto(uri: string): Promise<PrepareResult> {
  let original;
  try {
    original = await ImageManipulator.manipulate(uri).renderAsync();
  } catch {
    return { ok: false, reason: "failed" };
  }

  return prepareWithFallback(async (attempt) => {
    const plan = planResize(original.width, original.height, attempt.maxEdge);
    const context = ImageManipulator.manipulate(original);
    if (plan) context.resize(plan);
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: attempt.quality,
      base64: true,
    });
    return {
      uri: saved.uri,
      base64: saved.base64 ?? "",
      width: saved.width,
      height: saved.height,
    };
  });
}
