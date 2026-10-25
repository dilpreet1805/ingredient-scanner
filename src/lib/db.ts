import * as SQLite from "expo-sqlite";

// Each entry is one migration. Never edit an old one: add a new entry instead.

const migrations: string[] = [
  `CREATE TABLE scans (
    id TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL,
    product_name TEXT,
    category TEXT NOT NULL,
    overall_risk TEXT NOT NULL,
    summary TEXT NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    image_file TEXT,
    nutrition_image_file TEXT,
    ingredients TEXT NOT NULL,
    benefits TEXT NOT NULL,
    concerns TEXT NOT NULL,
    additives TEXT NOT NULL,
    nutrition_per_100g TEXT
    ); 
    CREATE INDEX idx_scans_created_at ON scans (created_at DESC);`,

  `CREATE TABLE profile (
     id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     birth_year INTEGER NOT NULL,
     height_cm REAL NOT NULL,
     weight_kg REAL NOT NULL,
     goal TEXT NOT NULL,
     avatar_file TEXT,
     newsletter_opt_in INTEGER NOT NULL DEFAULT 0,
     goal_calories INTEGER NOT NULL,
     goal_carbs_g INTEGER NOT NULL,
     goal_protein_g INTEGER NOT NULL,
     goal_fat_g INTEGER NOT NULL,
     created_at TEXT NOT NULL
   );`,
];

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let version = row?.user_version ?? 0;
  if (version >= migrations.length) return;

  await db.withTransactionAsync(async () => {
    for (; version < migrations.length; version++) {
      await db.execAsync(migrations[version]);
    }
    await db.execAsync(`PRAGMA user_version = ${migrations.length}`);
  });
}

async function open() {
  const db = await SQLite.openDatabaseAsync("ingredient-scanner.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await migrate(db);
  return db;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** One shared connection. The first caller opens and migrates it. */

export function getDb() {
  if (!dbPromise) {
    dbPromise = open().catch((error) => {
      dbPromise = null; // allow a retry after a failure
      throw error;
    });
  }
  return dbPromise;
}
