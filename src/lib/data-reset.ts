import { getDb } from "@/lib/db";
import { deleteAllImages } from "@/lib/image-store";

/** Removes everything the app stores on this phone. */
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM scans");
    await db.runAsync("DELETE FROM profile");
    await db.runAsync("DELETE FROM scans");
    await db.runAsync("DELETE FROM meals");
    await db.runAsync("DELETE FROM profile");
  });
  deleteAllImages();
}
