import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import type { MealType } from "@/types";
import { mealTypes } from "./meal-types";

type Props = { value: MealType; onChange: (type: MealType) => void };

export function MealTypePicker({ value, onChange }: Props) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Meal type"
      className="flex-row gap-2"
    >
      {mealTypes.map((type) => {
        const selected = type.value === value;
        return (
          <Pressable
            key={type.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(type.value)}
            className={cn(
              "min-h-[72px] flex-1 items-center justify-center gap-1 rounded-control border",
              selected
                ? "border-primary bg-primary-soft"
                : "border-primary-soft bg-canvas",
            )}
          >
            <Ionicons
              name={type.icon}
              size={22}
              color={selected ? colors.primary : colors.muted}
            />
            <AppText
              variant="caption"
              className={cn(
                "text-xs",
                selected && "font-body-bold text-forest",
              )}
            >
              {type.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
