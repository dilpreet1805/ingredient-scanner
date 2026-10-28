import type { KeyValueBackend } from "../../lib/chunked-storage";
import type { AgeTier } from "./age-policy";

export type AgeRecord = { tier: AgeTier; birthYear: number | null };

const TIERS: readonly AgeTier[] = ["blocked", "teen", "adult"];
const MIN_YEAR = 1900;

export function createAgeRepository(
  backend: KeyValueBackend,
  key = "age-record",
) {
  return {
    async read(): Promise<AgeRecord | null> {
      try {
        const raw = await backend.get(key);
        if (raw === null) return null;
        const data: unknown = JSON.parse(raw);
        if (typeof data !== "object" || data === null) return null;

        const { tier, birthYear } = data as {
          tier?: unknown;
          birthYear?: unknown;
        };
        const known = TIERS.find((t) => t === tier);
        if (!known) return null;
        if (known !== "adult") return { tier: known, birthYear: null };

        const thisYear = new Date().getFullYear();
        if (
          typeof birthYear === "number" &&
          Number.isInteger(birthYear) &&
          birthYear >= MIN_YEAR &&
          birthYear <= thisYear
        ) {
          return { tier: "adult", birthYear };
        }
        return null; // an adult without a usable birth year is asked again
      } catch {
        return null; // unreadable storage means we ask again, never that we guess
      }
    },

    write: (record: AgeRecord) =>
      backend.set(
        key,
        JSON.stringify({
          tier: record.tier,
          birthYear: record.tier === "adult" ? record.birthYear : null,
        }),
      ),

    clear: () => backend.remove(key),
  };
}
