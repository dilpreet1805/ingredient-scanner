import { TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import { AppText } from "./app-text";

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  error,
  hint,
  className,
  ...rest
}: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <AppText variant="body" className="font-body-semibold text-forest">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        className={cn(
          "min-h-[52px] rounded-control border bg-canvas px-4 font-body text-base text-ink",
          error ? "border-risk-high" : "border-primary-soft",
          className,
        )}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" className="text-risk-high">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption">{hint}</AppText>
      ) : null}
    </View>
  );
}
