import type { DailyGoals, Nutrition, ScanResult, UserProfile } from "@/types";

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

export const recentScans: ScanResult[] = [
  {
    id: "1",
    createdAt: "2026-10-24T09:10:00.000Z",
    imageUri: null,
    productName: "Instant noodles",
    category: "noodles",
    ingredients: [
      "Wheat flour",
      "Palm oil",
      "Salt",
      "Flavour enhancers (E621, E627)",
      "Spices",
    ],
    benefits: ["Quick source of energy"],
    concerns: ["High in sodium", "Refined flour, low in fibre"],
    additives: [
      {
        code: "E621",
        name: "Monosodium glutamate",
        purpose: "Boosts savoury (umami) flavour.",
        sideEffects: [
          "Some people report headaches or flushing; controlled studies haven't consistently confirmed this.",
        ],
        riskLevel: "moderate",
      },
      {
        code: "E627",
        name: "Disodium guanylate",
        purpose: "Strengthens the flavour boost from MSG.",
        sideEffects: ["People with gout are often advised to limit it."],
        riskLevel: "low",
      },
    ],
    overallRisk: "high",
    pinned: false,
  },
  {
    id: "2",
    createdAt: "2026-10-23T17:40:00.000Z",
    imageUri: null,
    productName: "Whole wheat bread",
    category: "bread",
    ingredients: ["Whole wheat flour", "Water", "Yeast", "Salt", "Sugar"],
    benefits: [
      "Good source of fibre",
      "Releases energy more slowly than white bread",
    ],
    concerns: ["Contains gluten"],
    additives: [],
    overallRisk: "low",
    pinned: false,
  },
  {
    id: "3",
    createdAt: "2026-10-21T12:05:00.000Z",
    imageUri: null,
    productName: "Fruit juice drink",
    category: "beverage",
    ingredients: [
      "Water",
      "Sugar",
      "Fruit juice concentrate (10%)",
      "Citric acid (E330)",
      "Sodium benzoate (E211)",
    ],
    benefits: ["Contains a little real fruit juice"],
    concerns: ["High in added sugar", "Low fruit content"],
    additives: [
      {
        code: "E330",
        name: "Citric acid",
        purpose: "Adds tartness and helps keep the drink fresh.",
        sideEffects: [],
        riskLevel: "low",
      },
      {
        code: "E211",
        name: "Sodium benzoate",
        purpose: "Preservative that stops mould and bacteria growing.",
        sideEffects: [
          "Linked to hyperactivity in some children when combined with certain artificial colours.",
        ],
        riskLevel: "moderate",
      },
    ],
    overallRisk: "moderate",
    pinned: false,
  },
];
