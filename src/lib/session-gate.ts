import { create } from "zustand";

type SessionGate = { allowed: boolean; allow: () => void; revoke: () => void };

/** A session may only be created after the age check has passed. */
export const useSessionGate = create<SessionGate>((set) => ({
  allowed: false,
  allow: () => set({ allowed: true }),
  revoke: () => set({ allowed: false }),
}));
