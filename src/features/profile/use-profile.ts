import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteAllData } from "@/lib/data-reset";
import { useOnboarding } from "./onboarding-state";
import {
    getProfile,
    saveProfile,
    type ProfileInput,
} from "./profile-repository";

const profileKey = ["profile"] as const;

/** data is null when no profile exists yet. */
export function useProfile() {
  return useQuery({ queryKey: profileKey, queryFn: getProfile });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => saveProfile(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey }),
  });
}

export function useDeleteAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllData,
    onSuccess: () => {
      useOnboarding.getState().reset();
      return queryClient.resetQueries();
    },
  });
}
