import {
    ActivityIndicator,
    Pressable,
    type PressableProps,
} from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

type Variant = "primary" | "accent" | "soft";

const containerClasses: Record<Variant, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  soft: "bg-primary-soft",
};

const labelClasses: Record<Variant, string> = {
  primary: "text-white",
  accent: "text-ink",
  soft: "text-ink",
};

type Props = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  className,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "min-h-[52px] flex-row items-center justify-center rounded-control px-6 active:opacity-80",
        containerClasses[variant],
        isDisabled && "opacity-50",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#22332A"}
        />
      ) : (
        <AppText variant="button" className={labelClasses[variant]}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}
