import { z } from "zod";

import type {
    ActivityLevel,
    DailyGoals,
    Sex,
    UserProfile,
    WeightGoal,
} from "@/types";
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

export const sexOptions: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unspecified", label: "Prefer not to say" },
];

export const sexLabel: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  unspecified: "Sex not shared",
};

export const activityOptions: {
  value: ActivityLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "sedentary",
    label: "Mostly seated",
    description: "Desk job, little exercise",
  },
  {
    value: "light",
    label: "Lightly active",
    description: "Light exercise 1 to 3 days a week",
  },
  {
    value: "moderate",
    label: "Moderately active",
    description: "Exercise 3 to 5 days a week",
  },
  {
    value: "very",
    label: "Very active",
    description: "Hard exercise most days, or a physical job",
  },
];

export const activityLabel: Record<ActivityLevel, string> = {
  sedentary: "Mostly seated",
  light: "Lightly active",
  moderate: "Moderately active",
  very: "Very active",
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
const sexEnum = z.enum(["male", "female", "unspecified"]);
const activityEnum = z.enum(["sedentary", "light", "moderate", "very"]);

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
  sex: sexEnum,
  activity: activityEnum,
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
  sex: "unspecified",
  activity: "light",
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
    sex: p.sex,
    activity: p.activity,
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
    sex: v.sex,
    activity: v.activity,
    goal: v.goal,
    avatarUri,
    newsletterOptIn: v.newsletterOptIn,
    dailyGoals,
  };
}
