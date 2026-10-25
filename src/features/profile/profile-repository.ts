import { getDb } from "@/lib/db";
import { imageUriFromFile, persistImage } from "@/lib/image-store";
import type { UserProfile, WeightGoal } from "@/types";

type ProfileRow = {
  name: string;
  email: string;
  birth_year: number;
  height_cm: number;
  weight_kg: number;
  goal: string;
  avatar_file: string | null;
  newsletter_opt_in: number;
  goal_calories: number;
  goal_carbs_g: number;
  goal_protein_g: number;
  goal_fat_g: number;
  created_at: string;
};

function toProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    email: row.email,
    birthYear: row.birth_year,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    goal: row.goal as WeightGoal,
    avatarUri: row.avatar_file ? imageUriFromFile(row.avatar_file) : null,
    newsletterOptIn: row.newsletter_opt_in === 1,
    dailyGoals: {
      calories: row.goal_calories,
      carbsG: row.goal_carbs_g,
      proteinG: row.goal_protein_g,
      fatG: row.goal_fat_g,
    },
    createdAt: row.created_at,
  };
}

export type ProfileInput = Omit<UserProfile, "createdAt">;

export async function getProfile(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>(
    "SELECT * FROM profile WHERE id = 1",
  );
  return row ? toProfile(row) : null;
}

/** Creates the profile, or updates it if one exists. created_at is set once. */
export async function saveProfile(input: ProfileInput): Promise<void> {
  const db = await getDb();
  const avatarFile = input.avatarUri ? persistImage(input.avatarUri) : null;

  await db.runAsync(
    `INSERT INTO profile (
       id, name, email, birth_year, height_cm, weight_kg, goal, avatar_file,
       newsletter_opt_in, goal_calories, goal_carbs_g, goal_protein_g, goal_fat_g, created_at
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       email = excluded.email,
       birth_year = excluded.birth_year,
       height_cm = excluded.height_cm,
       weight_kg = excluded.weight_kg,
       goal = excluded.goal,
       avatar_file = excluded.avatar_file,
       newsletter_opt_in = excluded.newsletter_opt_in,
       goal_calories = excluded.goal_calories,
       goal_carbs_g = excluded.goal_carbs_g,
       goal_protein_g = excluded.goal_protein_g,
       goal_fat_g = excluded.goal_fat_g`,
    input.name,
    input.email,
    input.birthYear,
    input.heightCm,
    input.weightKg,
    input.goal,
    avatarFile,
    input.newsletterOptIn ? 1 : 0,
    input.dailyGoals.calories,
    input.dailyGoals.carbsG,
    input.dailyGoals.proteinG,
    input.dailyGoals.fatG,
    new Date().toISOString(),
  );
}
