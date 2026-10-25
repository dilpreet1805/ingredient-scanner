import { z } from "zod";

import type { DailyGoals, UserProfile, WeightGoal } from "@/types";
import type { ProfileInput } from "./profile-repository";

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  carbsG: 250,
  proteinG: 75,
  fatG: 65,
};

export const goalOptions: { value: WeightGoal; label: string }[] = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain weight" },
];

export const goalLabel: Record<WeightGoal, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
};

/**
 * Form inputs hold text, so fields are validated as strings and converted to
 * numbers on save. Ranges are product choices: adjust them as you see fit.
 */
const numberField = (what: string, min: number, max: number, whole = false) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${what}`)
    .refine((v) => !Number.isNaN(Number(v)), "Enter a number")
    .refine(
      (v) => Number(v) >= min && Number(v) <= max,
      `Must be between ${min} and ${max}`,
    )
    .refine((v) => !whole || Number.isInteger(Number(v)), "Use a whole number");

const thisYear = new Date().getFullYear();
const goalEnum = z.enum(["lose", "maintain", "gain"]);

export const personalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(60, "That name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .email("Enter a valid email address"),
  birthYear: numberField(
    "your birth year",
    thisYear - 100,
    thisYear - 13,
    true,
  ),
  heightCm: numberField("your height", 100, 250),
  weightKg: numberField("your weight", 20, 300),
  goal: goalEnum,
  newsletterOptIn: z.boolean(),
});
export type PersonalValues = z.infer<typeof personalSchema>;

export const goalsSchema = z.object({
  goal: goalEnum,
  calories: numberField("a calorie target", 800, 6000, true),
  carbsG: numberField("a carbs target", 20, 1000, true),
  proteinG: numberField("a protein target", 10, 500, true),
  fatG: numberField("a fat target", 10, 400, true),
});
export type GoalsValues = z.infer<typeof goalsSchema>;

export const emptyPersonalValues: PersonalValues = {
  name: "",
  email: "",
  birthYear: "",
  heightCm: "",
  weightKg: "",
  goal: "maintain",
  newsletterOptIn: false,
};

export function profileToPersonalValues(p: UserProfile): PersonalValues {
  return {
    name: p.name,
    email: p.email,
    birthYear: String(p.birthYear),
    heightCm: String(p.heightCm),
    weightKg: String(p.weightKg),
    goal: p.goal,
    newsletterOptIn: p.newsletterOptIn,
  };
}

export function personalValuesToInput(
  v: PersonalValues,
  avatarUri: string | null,
  dailyGoals: DailyGoals,
): ProfileInput {
  return {
    name: v.name,
    email: v.email,
    birthYear: Number(v.birthYear),
    heightCm: Number(v.heightCm),
    weightKg: Number(v.weightKg),
    goal: v.goal,
    avatarUri,
    newsletterOptIn: v.newsletterOptIn,
    dailyGoals,
  };
}
