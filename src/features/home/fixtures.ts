import type { DailyGoals, Nutrition, UserProfile } from "@/types";

// TEMPORARY sample data. Real content will come from the AI analysis.

export const profile: UserProfile = {
  name: "Alex",
  email: "alex@example.com",
  heightCm: 172,
  weightKg: 70,
  avatarUri: null,
};

export const goals: DailyGoals = {
  calories: 2000,
  carbsG: 250,
  proteinG: 75,
  fatG: 65,
};

export const eatenToday: Nutrition = {
  calories: 1450,
  carbsG: 170,
  proteinG: 48,
  fatG: 52,
};
