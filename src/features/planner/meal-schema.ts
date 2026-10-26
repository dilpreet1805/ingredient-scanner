import { z } from "zod";

const numberText = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max,
      message,
    );

const name = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(80, "That name is too long");
const calories = z
  .string()
  .trim()
  .min(1, "Enter the calories")
  .pipe(numberText(0, 5000, "Calories must be between 0 and 5000"));
// Macros may be left empty and count as 0.
const macro = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" ||
        (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= max),
      `${label} must be between 0 and ${max}`,
    );

export const addMealSchema = z.object({
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name,
  calories,
  carbsG: macro("Carbs", 1000),
  proteinG: macro("Protein", 500),
  fatG: macro("Fat", 500),
});
export type AddMealValues = z.infer<typeof addMealSchema>;

export const editMealSchema = z.object({
  name,
  quantity: z
    .string()
    .trim()
    .min(1, "Enter an amount")
    .pipe(numberText(0.01, 10000, "Enter an amount greater than 0")),
  calories,
  carbsG: macro("Carbs", 1000),
  proteinG: macro("Protein", 500),
  fatG: macro("Fat", 500),
});
export type EditMealValues = z.infer<typeof editMealSchema>;

/** Empty or invalid text counts as 0. */
export function toNumber(text: string | undefined): number {
  const n = Number((text ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}
