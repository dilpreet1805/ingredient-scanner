/** Calories and macros. Reused by scans, meals and daily goals. */
export type Nutrition = {
  calories: number; // kcal
  carbsG: number;
  proteinG: number;
  fatG: number;
};

export type RiskLevel = "low" | "moderate" | "high";

/** One additive found on a label, e.g. E621. */
export type Additive = {
  code: string;
  name: string;
  purpose: string;
  sideEffects: string[]; // empty array if none known
  riskLevel: RiskLevel;
};

export type ProductCategory =
  | "noodles"
  | "bread"
  | "beverage"
  | "snack"
  | "sweets"
  | "dairy"
  | "cereal"
  | "sauce"
  | "frozen"
  | "fruit_veg"
  | "meat_fish"
  | "other";

export type ScanResult = {
  id: string;
  createdAt: string; // ISO date string
  imageUri: string | null;
  productName: string | null;
  category: ProductCategory;
  ingredients: string[];
  benefits: string[];
  concerns: string[];
  additives: Additive[];
  overallRisk: RiskLevel;
  pinned: boolean;
  summary: string;
  nutritionPer100g: Nutrition | null;
  nutritionImageUri: string | null;
};

export type ScanAnalysis = Pick<
  ScanResult,
  | "productName"
  | "category"
  | "summary"
  | "overallRisk"
  | "ingredients"
  | "benefits"
  | "concerns"
  | "additives"
  | "nutritionPer100g"
>;

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type Meal = {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: MealType;
  name: string;
  nutrition: Nutrition;
  source: "manual" | "photo";
};

export type FoodEstimate = {
  name: string;
  nutrition: Nutrition;
  confidence: "low" | "medium" | "high";
};

export type DailyGoals = Nutrition;

export type WeightGoal = "lose" | "maintain" | "gain";

export type UserProfile = {
  name: string;
  email: string;
  birthYear: number; // age is computed from this
  heightCm: number;
  weightKg: number;
  goal: WeightGoal;
  avatarUri: string | null;
  newsletterOptIn: boolean;
  dailyGoals: DailyGoals;
  createdAt: string; // ISO date the profile was first saved
};
