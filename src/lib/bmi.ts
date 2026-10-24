export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

/** BMI = weight (kg) divided by height (m) squared. Null if inputs are invalid. */
export function calculateBmi(
  weightKg: number,
  heightCm: number,
): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Standard WHO adult cut-offs. */

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}
