import type { DailyGoals, Nutrition, ScanResult, UserProfile } from "@/types";

// TEMPORARY: replaced with real data in later steps.

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

export type ScanSummary = Pick<
  ScanResult,
  "id" | "productName" | "createdAt" | "overallRisk"
>;

export const recentScans: ScanSummary[] = [
  {
    id: "1",
    productName: "Instant noodles",
    createdAt: "2026-10-24T09:10:00.000Z",
    overallRisk: "high",
  },
  {
    id: "2",
    productName: "Whole wheat bread",
    createdAt: "2026-10-23T17:40:00.000Z",
    overallRisk: "low",
  },
  {
    id: "3",
    productName: "Fruit juice drink",
    createdAt: "2026-10-21T12:05:00.000Z",
    overallRisk: "moderate",
  },
];
