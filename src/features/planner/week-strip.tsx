import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import {
    addDays,
    formatDayLabel,
    fromDateKey,
    toDateKey,
    weekDays,
    weekdayShort,
} from "@/lib/dates";

type Props = { selected: string; onSelect: (key: string) => void };

export function WeekStrip({ selected, onSelect }: Props) {
  const today = toDateKey(new Date());

  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        onPress={() => onSelect(addDays(selected, -7))}
        className="h-11 w-7 items-center justify-center active:opacity-60"
      >
        <Ionicons name="chevron-back" size={20} color={colors.muted} />
      </Pressable>

      <View className="flex-1 flex-row gap-1">
        {weekDays(selected).map((key) => {
          const isSelected = key === selected;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatDayLabel(key, today)}
              onPress={() => onSelect(key)}
              className={cn(
                "flex-1 items-center gap-0.5 rounded-2xl py-2",
                isSelected ? "bg-primary" : "bg-surface",
              )}
            >
              <AppText
                variant="caption"
                className={cn("text-xs", isSelected && "text-white")}
              >
                {weekdayShort(key)}
              </AppText>
              <AppText
                variant="body"
                className={cn(
                  "font-body-bold",
                  isSelected ? "text-white" : "text-forest",
                )}
              >
                {fromDateKey(key).getDate()}
              </AppText>
              <View
                className={cn(
                  "h-1 w-1 rounded-full",
                  key === today
                    ? isSelected
                      ? "bg-white"
                      : "bg-primary"
                    : "bg-transparent",
                )}
              />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next week"
        onPress={() => onSelect(addDays(selected, 7))}
        className="h-11 w-7 items-center justify-center active:opacity-60"
      >
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}
