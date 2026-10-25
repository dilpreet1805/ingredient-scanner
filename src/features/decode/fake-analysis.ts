import type { ScanAnalysis } from "@/types";

// TEMPORARY: replaced by the real AI call in Step 6. Flip to true to preview the error state.
const SIMULATE_ERROR = false;

export class AnalysisError extends Error {}

const samples: ScanAnalysis[] = [
  {
    productName: "Instant noodles",
    category: "noodles",
    summary: "High in sodium, refined flour, low in fibre.",
    overallRisk: "high",
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
    nutritionPer100g: { calories: 450, carbsG: 62, proteinG: 9, fatG: 18 },
  },
  {
    productName: "Whole wheat bread",
    category: "bread",
    summary: "Good source of fibre, whole grains.",
    overallRisk: "low",
    ingredients: ["Whole wheat flour", "Water", "Yeast", "Salt", "Sugar"],
    benefits: [
      "Good source of fibre",
      "Releases energy more slowly than white bread",
    ],
    concerns: ["Contains gluten"],
    additives: [],
    nutritionPer100g: { calories: 250, carbsG: 43, proteinG: 10, fatG: 3 },
  },
  {
    productName: "Fruit juice drink",
    category: "beverage",
    summary: "High in sugar, low in real fruit.",
    overallRisk: "moderate",
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
    nutritionPer100g: { calories: 45, carbsG: 11, proteinG: 0, fatG: 0 },
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function analyzeLabel(photos: {
  ingredientsUri: string;
  nutritionUri: string | null;
}): Promise<ScanAnalysis> {
  await wait(1500);
  if (SIMULATE_ERROR) {
    throw new AnalysisError(
      "We couldn't read the ingredient list. Try a sharper photo with better light.",
    );
  }
  const sample = samples[Math.floor(Math.random() * samples.length)];
  // No nutrition photo, so no nutrition panel, like the real flow will behave.
  return {
    ...sample,
    nutritionPer100g: photos.nutritionUri ? sample.nutritionPer100g : null,
  };
}
