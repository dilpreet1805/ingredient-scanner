import type { ActivityLevel, DailyGoals, Sex, WeightGoal } from "@/types";
import { bmiCategory, calculateBmi } from "./bmi";

// Product choices, not medical rules. Have a dietitian review them before launch.
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

// Mifflin-St Jeor constant. "unspecified" is the average of the two.
const SEX_OFFSET: Record<Sex, number> = {
  male: 5,
  female: -161,
  unspecified: -78,
};

const GOAL_ADJUSTMENT: Record<WeightGoal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

const CALORIE_FLOOR: Record<Sex, number> = {
  male: 1500,
  female: 1200,
  unspecified: 1200,
};

// Share of calories from each macro.
const MACRO_SHARE: Record<
  WeightGoal,
  { protein: number; carbs: number; fat: number }
> = {
  lose: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  maintain: { protein: 0.2, carbs: 0.5, fat: 0.3 },
  gain: { protein: 0.2, carbs: 0.55, fat: 0.25 },
};

export type TargetInput = {
  sex: Sex;
  activity: ActivityLevel;
  goal: WeightGoal;
  birthYear: number;
  heightCm: number;
  weightKg: number;
};

/** Machine-readable reasons. The screen turns these into wording. */
export type SuggestionNote =
  | "underweight-no-deficit"
  | "calorie-floor"
  | "sex-unspecified";

export type TargetSuggestion =
  | {
      status: "ok";
      goals: DailyGoals;
      /** The goal the numbers are for. Can differ from the requested one. */
      goal: WeightGoal;
      notes: SuggestionNote[];
    }
  | { status: "unavailable"; reason: "under-18" | "invalid-input" };

export function suggestTargets(
  input: TargetInput,
  currentYear = new Date().getFullYear(),
): TargetSuggestion {
  const age = currentYear - input.birthYear;
  const bmi = calculateBmi(input.weightKg, input.heightCm);

  if (bmi === null || !Number.isFinite(age) || age <= 0) {
    return { status: "unavailable", reason: "invalid-input" };
  }
  if (age < 18) return { status: "unavailable", reason: "under-18" };

  const notes: SuggestionNote[] = [];
  let goal = input.goal;

  if (goal === "lose" && bmiCategory(bmi) === "underweight") {
    goal = "maintain";
    notes.push("underweight-no-deficit");
  }

  const restingEnergy =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * age +
    SEX_OFFSET[input.sex];
  let calories =
    restingEnergy * ACTIVITY_FACTOR[input.activity] + GOAL_ADJUSTMENT[goal];

  const floor = CALORIE_FLOOR[input.sex];
  if (calories < floor) {
    calories = floor;
    notes.push("calorie-floor");
  }
  calories = Math.round(calories / 10) * 10;

  if (input.sex === "unspecified") notes.push("sex-unspecified");

  const share = MACRO_SHARE[goal];
  return {
    status: "ok",
    goal,
    notes,
    goals: {
      calories,
      proteinG: Math.round((calories * share.protein) / 4),
      carbsG: Math.round((calories * share.carbs) / 4),
      fatG: Math.round((calories * share.fat) / 9),
    },
  };
}
