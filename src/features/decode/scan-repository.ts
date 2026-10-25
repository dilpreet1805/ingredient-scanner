import * as Crypto from "expo-crypto";

import { getDb } from "@/lib/db";
import { imageUriFromFile, persistImage } from "@/lib/image-store";
import type {
    Additive,
    Nutrition,
    ProductCategory,
    RiskLevel,
    ScanAnalysis,
    ScanResult,
} from "@/types";

/** How many unpinned scans the app shows. Pinned scans are always shown. */
export const VISIBLE_LIMIT = 10;

type ScanRow = {
  id: string;
  created_at: string;
  product_name: string | null;
  category: string;
  overall_risk: string;
  summary: string;
  pinned: number;
  image_file: string | null;
  nutrition_image_file: string | null;
  ingredients: string;
  benefits: string;
  concerns: string;
  additives: string;
  nutrition_per_100g: string | null;
};

// The casts below trust our own data. Data from the AI gets real validation in Step 6.
function toScan(row: ScanRow): ScanResult {
  return {
    id: row.id,
    createdAt: row.created_at,
    productName: row.product_name,
    category: row.category as ProductCategory,
    overallRisk: row.overall_risk as RiskLevel,
    summary: row.summary,
    pinned: row.pinned === 1,
    imageUri: row.image_file ? imageUriFromFile(row.image_file) : null,
    nutritionImageUri: row.nutrition_image_file
      ? imageUriFromFile(row.nutrition_image_file)
      : null,
    ingredients: JSON.parse(row.ingredients) as string[],
    benefits: JSON.parse(row.benefits) as string[],
    concerns: JSON.parse(row.concerns) as string[],
    additives: JSON.parse(row.additives) as Additive[],
    nutritionPer100g: row.nutrition_per_100g
      ? (JSON.parse(row.nutrition_per_100g) as Nutrition)
      : null,
  };
}

/** The latest scans plus every pinned one, newest first. */
export async function listVisibleScans(): Promise<ScanResult[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScanRow>(
    `SELECT * FROM scans
     WHERE pinned = 1
        OR id IN (SELECT id FROM scans WHERE pinned = 0 ORDER BY created_at DESC LIMIT ?)
     ORDER BY created_at DESC`,
    VISIBLE_LIMIT,
  );
  return rows.map(toScan);
}

/** Finds any scan by id, even one that has dropped out of the visible list. */
export async function getScan(id: string): Promise<ScanResult | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ScanRow>(
    "SELECT * FROM scans WHERE id = ?",
    id,
  );
  return row ? toScan(row) : null;
}

export async function createScan(
  analysis: ScanAnalysis,
  photos: { ingredientsUri: string; nutritionUri: string | null },
): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const imageFile = persistImage(photos.ingredientsUri);
  const nutritionImageFile = photos.nutritionUri
    ? persistImage(photos.nutritionUri)
    : null;

  await db.runAsync(
    `INSERT INTO scans (
       id, created_at, product_name, category, overall_risk, summary, pinned,
       image_file, nutrition_image_file,
       ingredients, benefits, concerns, additives, nutrition_per_100g
     ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    new Date().toISOString(),
    analysis.productName,
    analysis.category,
    analysis.overallRisk,
    analysis.summary,
    imageFile,
    nutritionImageFile,
    JSON.stringify(analysis.ingredients),
    JSON.stringify(analysis.benefits),
    JSON.stringify(analysis.concerns),
    JSON.stringify(analysis.additives),
    analysis.nutritionPer100g
      ? JSON.stringify(analysis.nutritionPer100g)
      : null,
  );

  return id;
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE scans SET pinned = ? WHERE id = ?",
    pinned ? 1 : 0,
    id,
  );
}
