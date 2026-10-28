import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAgeStore } from "@/features/age/age-store";
import { deleteAllData } from "@/lib/data-reset";
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
      void useAgeStore.getState().reset();
      return queryClient.resetQueries();
    },
  });
}
