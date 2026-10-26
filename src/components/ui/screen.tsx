import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Leave room for the system navigation bar. Use on screens with no tab bar below them. */
  safeBottom?: boolean;
};

export function Screen({ children, className, safeBottom = false }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: colors.canvas,
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName={cn("gap-4 px-6 pb-8 pt-4", className)}
      >
        {children}
        {safeBottom && <View style={{ height: insets.bottom }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
