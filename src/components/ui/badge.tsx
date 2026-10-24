import { View } from "react-native";

import { cn } from "@/lib/cn";

import type { RiskLevel } from "@/types";

import { AppText } from "./app-text";

const config: Record<
  RiskLevel,
  { label: string; container: string; text: string }
> = {
  low: { label: "Low risk", container: "bg-risk-low", text: "text-white" },
  moderate: {
    label: "Moderate risk",
    container: "bg-risk-mid",
    text: "text-ink",
  },
  high: { label: "High risk", container: "bg-risk-high", text: "text-white" },
};

type Props = {
  level: RiskLevel;
  className?: string;
};

export function Badge({ level, className }: Props) {
  const { label, container, text } = config[level];

  return (
    <View
      accessibilityLabel={label}
      className={cn("self-start rounded-full px-3 py-1", container, className)}
    >
      <AppText variant="caption" className={cn("font-body-bold", text)}>
        {label}
      </AppText>
    </View>
  );
}
