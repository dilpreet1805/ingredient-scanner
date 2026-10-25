import { create } from "zustand";

type CaptureDraft = {
  ingredientsUri: string | null;
  nutritionUri: string | null;
  /** Starts a new draft with the first photo. */
  begin: (ingredientsUri: string) => void;
  setIngredients: (uri: string | null) => void;
  setNutrition: (uri: string | null) => void;
  reset: () => void;
};

export const useCaptureDraft = create<CaptureDraft>((set) => ({
  ingredientsUri: null,
  nutritionUri: null,
  begin: (ingredientsUri) => set({ ingredientsUri, nutritionUri: null }),
  setIngredients: (ingredientsUri) => set({ ingredientsUri }),
  setNutrition: (nutritionUri) => set({ nutritionUri }),
  reset: () => set({ ingredientsUri: null, nutritionUri: null }),
}));
