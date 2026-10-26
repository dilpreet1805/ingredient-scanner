import * as Crypto from "expo-crypto";

import { getDb } from "@/lib/db";
import type {
    MealBasis,
    MealItem,
    MealSource,
    MealType,
    Nutrition,
    ProductCategory,
} from "@/types";

type MealRow = {
  id: string;
  date: string;
  meal_type: string;
  name: string;
  basis: string;
  quantity: number;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  source: string;
  scan_id: string | null;
  category: string | null;
  created_at: string;
};

function toMeal(row: MealRow): MealItem {
  return {
    id: row.id,
    date: row.date,
    type: row.meal_type as MealType,
    name: row.name,
    basis: row.basis as MealBasis,
    quantity: row.quantity,
    nutrition: {
      calories: row.calories,
      carbsG: row.carbs_g,
      proteinG: row.protein_g,
      fatG: row.fat_g,
    },
    source: row.source as MealSource,
    scanId: row.scan_id,
    category: row.category as ProductCategory | null,
    createdAt: row.created_at,
  };
}

export type NewMeal = Omit<MealItem, "id" | "createdAt">;
export type MealPatch = {
  name: string;
  quantity: number;
  nutrition: Nutrition;
};

export async function listMealsForDate(date: string): Promise<MealItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MealRow>(
    "SELECT * FROM meals WHERE date = ? ORDER BY created_at",
    date,
  );
  return rows.map(toMeal);
}

export async function getMeal(id: string): Promise<MealItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MealRow>(
    "SELECT * FROM meals WHERE id = ?",
    id,
  );
  return row ? toMeal(row) : null;
}

/** The latest entry for each distinct meal name, newest first. */
export async function listRecentMeals(limit = 20): Promise<MealItem[]> {
  const db = await getDb();
  // With MAX(), SQLite returns the other columns from the row that holds the maximum.
  const rows = await db.getAllAsync<MealRow>(
    `SELECT *, MAX(created_at) AS latest FROM meals
     GROUP BY lower(name) ORDER BY latest DESC LIMIT ?`,
    limit,
  );
  return rows.map(toMeal);
}

export async function addMeal(input: NewMeal): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(
    `INSERT INTO meals (
       id, date, meal_type, name, basis, quantity,
       calories, carbs_g, protein_g, fat_g,
       source, scan_id, category, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.date,
    input.type,
    input.name,
    input.basis,
    input.quantity,
    input.nutrition.calories,
    input.nutrition.carbsG,
    input.nutrition.proteinG,
    input.nutrition.fatG,
    input.source,
    input.scanId,
    input.category,
    new Date().toISOString(),
  );
  return id;
}

export async function updateMeal(id: string, patch: MealPatch): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE meals SET name = ?, quantity = ?, calories = ?, carbs_g = ?, protein_g = ?, fat_g = ?
     WHERE id = ?`,
    patch.name,
    patch.quantity,
    patch.nutrition.calories,
    patch.nutrition.carbsG,
    patch.nutrition.proteinG,
    patch.nutrition.fatG,
    id,
  );
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM meals WHERE id = ?", id);
}
