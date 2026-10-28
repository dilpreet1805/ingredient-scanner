import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { KeyValueBackend } from "@/lib/chunked-storage";
import {
    calculateAge,
    tierForAge,
    todayParts,
    type AgeState,
    type AgeTier,
    type DateParts,
} from "./age-policy";
import { createAgeRepository, type AgeRecord } from "./age-repository";

export type SubmitResult =
  | { ok: true; tier: AgeTier }
  | { ok: false; reason: "invalid_date" | "future_date" | "too_old" };

const backend: KeyValueBackend = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};

const repository = createAgeRepository(backend);

type AgeStore = {
  tier: AgeState;
  /** Set for adults only. It pre-fills the profile and is never sent anywhere. */
  birthYear: number | null;
  loaded: boolean;
  load: () => Promise<void>;
  /** Works out the age from the date, keeps only the tier (and an adult's birth year), and forgets the date. */
  submit: (birth: DateParts) => Promise<SubmitResult>;
  reset: () => Promise<void>;
};

export const useAgeStore = create<AgeStore>((set) => ({
  tier: "unknown",
  birthYear: null,
  loaded: false,

  load: async () => {
    const saved = await repository.read();
    set({
      tier: saved?.tier ?? "unknown",
      birthYear: saved?.birthYear ?? null,
      loaded: true,
    });
  },

  submit: async (birth) => {
    const result = calculateAge(birth, todayParts());
    if (!result.ok) return result; // nothing is saved and nothing locks

    const tier = tierForAge(result.age);
    const record: AgeRecord = {
      tier,
      birthYear: tier === "adult" ? birth.year : null,
    };
    set({ tier: record.tier, birthYear: record.birthYear });
    try {
      await repository.write(record);
    } catch {
      // The app keeps working. It will ask again next launch.
    }
    return { ok: true, tier };
  },

  reset: async () => {
    set({ tier: "unknown", birthYear: null });
    try {
      await repository.clear();
    } catch {
      // Nothing to clean up.
    }
  },
}));
