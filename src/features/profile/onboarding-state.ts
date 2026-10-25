import { create } from "zustand";

type OnboardingState = {
  skipped: boolean;
  skip: () => void;
  reset: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  skipped: false,
  skip: () => set({ skipped: true }),
  reset: () => set({ skipped: false }),
}));
