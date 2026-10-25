import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Screen({ children, className }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName={cn("gap-4 px-6 pb-8 pt-4", className)}
      >
        {children}
      </ScrollView>
    </View>
  );
}
