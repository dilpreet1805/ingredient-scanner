import { create } from "zustand";

type LaunchState = { handled: boolean; markHandled: () => void };

/** True once Home has been shown for the first time in this session. It resets when the app restarts. */
export const useLaunch = create<LaunchState>((set) => ({
  handled: false,
  markHandled: () => set({ handled: true }),
}));
