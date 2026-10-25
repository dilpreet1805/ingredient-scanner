import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

type Variant = "primary" | "cta" | "accent" | "soft";

const containerClasses: Record<Variant, string> = {
  primary: "bg-primary",
  cta: "bg-accent-strong",
  accent: "bg-accent",
  soft: "bg-primary-soft",
};

const labelClasses: Record<Variant, string> = {
  primary: "text-white",
  cta: "text-white",
  accent: "text-ink",
  soft: "text-forest",
};

type Props = Omit<PressableProps, "children"> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  left?: ReactNode;
  right?: ReactNode;
};

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  left,
  right,
  className,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const lightSpinner = variant === "primary" || variant === "cta";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "min-h-[52px] flex-row items-center justify-center gap-2 rounded-control px-6 active:opacity-80",
        containerClasses[variant],
        isDisabled && "opacity-50",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={lightSpinner ? "#FFFFFF" : "#22332A"} />
      ) : (
        <>
          {left}
          <AppText variant="button" className={labelClasses[variant]}>
            {title}
          </AppText>
          {right}
        </>
      )}
    </Pressable>
  );
}
