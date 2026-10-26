import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    addMeal,
    deleteMeal,
    getMeal,
    listMealsForDate,
    listRecentMeals,
    updateMeal,
    type MealPatch,
    type NewMeal,
} from "./meal-repository";

const mealsKey = ["meals"] as const;

export function useMealsForDate(date: string) {
  return useQuery({
    queryKey: [...mealsKey, "day", date],
    queryFn: () => listMealsForDate(date),
  });
}

export function useMeal(id: string | undefined) {
  return useQuery({
    queryKey: [...mealsKey, "item", id],
    queryFn: () => getMeal(id as string),
    enabled: Boolean(id),
  });
}

export function useRecentMeals() {
  return useQuery({
    queryKey: [...mealsKey, "recent"],
    queryFn: () => listRecentMeals(),
  });
}

function useInvalidateMeals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: mealsKey });
}

export function useAddMeal() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (meal: NewMeal) => addMeal(meal),
    onSuccess: invalidate,
  });
}

export function useUpdateMeal() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (args: { id: string; patch: MealPatch }) =>
      updateMeal(args.id, args.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteMeal() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (id: string) => deleteMeal(id),
    onSuccess: invalidate,
  });
}
