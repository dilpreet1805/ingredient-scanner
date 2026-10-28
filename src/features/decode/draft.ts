import type { Missing, Quota } from "./decode-api";
import type { LabelReading } from "./label-reading";
import type { ReadResult } from "./run-decode";

type ReadOutcome = ReadResult & { photoUri: string };

export type Draft = {
  reading: LabelReading;
  missing: Missing[];
  warnings: string[];
  photoUris: string[];
  quota: Quota;
};

const hasText = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function toDraft(read: ReadOutcome): Draft {
  return {
    reading: read.reading,
    missing: read.missing,
    warnings: read.warnings,
    photoUris: [read.photoUri],
    quota: read.quota,
  };
}

/** Combines two photos of the same product. The first photo wins when both have a value. */
export function mergeDrafts(first: Draft, second: Draft): Draft {
  const a = first.reading;
  const b = second.reading;

  const reading: LabelReading = {
    isFoodLabel: true,
    brand: hasText(a.brand) ? a.brand : b.brand,
    productName: hasText(a.productName) ? a.productName : b.productName,
    category: a.category === "other" ? b.category : a.category,
    ingredientsText: hasText(a.ingredientsText)
      ? a.ingredientsText
      : b.ingredientsText,
    allergenStatements: [
      ...new Set([...a.allergenStatements, ...b.allergenStatements]),
    ],
    servingSize: a.servingSize ?? b.servingSize,
    servingsPerPack: a.servingsPerPack ?? b.servingsPerPack,
    nutrition: a.nutrition ?? b.nutrition,
  };

  const missing: Missing[] = [];
  if (!hasText(reading.ingredientsText)) missing.push("ingredients");
  if (reading.nutrition === null) missing.push("nutrition");

  // Every server warning is about the nutrition panel, so keep the warnings
  // of the photo whose panel we kept.
  const warningsFrom =
    a.nutrition !== null || b.nutrition === null ? first : second;

  return {
    reading,
    missing,
    warnings: warningsFrom.warnings,
    photoUris: [...first.photoUris, ...second.photoUris],
    quota: second.quota, // the newer count is the true one
  };
}
