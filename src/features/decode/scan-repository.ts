import * as Crypto from "expo-crypto";

import { getDb } from "@/lib/db";
import { imageUriFromFile, persistImage } from "@/lib/image-store";
import type { NewScan, ScanResult } from "@/types";

import { rowToScan, scanToParams, type ScanRow } from "./scan-row";

/** How many unpinned scans the app shows. Pinned scans are always shown. */
export const VISIBLE_LIMIT = 10;

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
  return rows.map((row) => rowToScan(row, imageUriFromFile));
}

/** Finds any scan by id, even one that has dropped out of the visible list. */
export async function getScan(id: string): Promise<ScanResult | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ScanRow>(
    "SELECT * FROM scans WHERE id = ?",
    id,
  );
  return row ? rowToScan(row, imageUriFromFile) : null;
}

export async function createScan(scan: NewScan): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  // The photos are temporary files: copy them into permanent storage first.
  const imageFiles = scan.photoUris.map(persistImage);

  // 14 values, in the same order as the column list. pinned starts at 0.
  await db.runAsync(
    `INSERT INTO scans (
       id, created_at, brand, product_name, category, ingredients_text,
       allergen_statements, serving_size, servings_per_pack, nutrition,
       warnings, barcode, confirmed, image_files, pinned
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    ...scanToParams(scan, id, new Date().toISOString(), imageFiles),
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
