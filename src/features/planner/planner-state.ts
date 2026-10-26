import { create } from "zustand";

import { toDateKey } from "@/lib/dates";

type PlannerState = {
  date: string;
  setDate: (date: string) => void;
  goToToday: () => void;
};

export const usePlannerDate = create<PlannerState>((set) => ({
  date: toDateKey(new Date()),
  setDate: (date) => set({ date }),
  goToToday: () => set({ date: toDateKey(new Date()) }),
}));
