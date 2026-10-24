import { View } from "react-native";

import { cn } from "@/lib/cn";

type Tone = "primary" | "accent";

const fillClasses: Record<Tone, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
};

type Props = {
  value: number;
  max: number;
  tone?: Tone;
  className?: string;
};

export function ProgressBar({
  value,
  max,
  tone = "primary",
  className,
}: Props) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}
      className={cn(
        "h-3 overflow-hidden rounded-full bg-primary-soft",
        className,
      )}
    >
      <View
        className={cn("h-full rounded-full", fillClasses[tone])}
        style={{ width: `${percent}%` }}
      />
    </View>
  );
}
