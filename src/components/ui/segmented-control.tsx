import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

type Props<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row gap-1 rounded-control bg-primary-soft p-1"
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
              "min-h-[44px] flex-1 items-center justify-center rounded-xl",
              selected && "bg-surface",
            )}
          >
            <AppText
              variant="caption"
              className={cn(
                "font-body-semibold",
                selected ? "text-forest" : "text-muted",
              )}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
