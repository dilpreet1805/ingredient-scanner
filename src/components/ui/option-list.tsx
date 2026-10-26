import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

type Props<T extends string> = {
  label: string;
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function OptionList<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="gap-2"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "min-h-[56px] flex-row items-center gap-3 rounded-control border px-4 py-2",
              selected
                ? "border-primary bg-primary-soft"
                : "border-primary-soft bg-canvas",
            )}
          >
            <Ionicons
              name={selected ? "radio-button-on" : "radio-button-off"}
              size={22}
              color={selected ? colors.primary : colors.muted}
            />
            <View className="flex-1">
              <AppText variant="body" className="font-body-semibold">
                {option.label}
              </AppText>
              {option.description && (
                <AppText variant="caption">{option.description}</AppText>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
