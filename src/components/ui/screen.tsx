import { createContext, useContext, useRef, type RefObject } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
  type ScrollViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";

// Lets content deep inside a Screen scroll it (e.g. to an opened row).
// null when the component is not inside a Screen.
const ScreenScrollContext = createContext<RefObject<ScrollViewInstance | null> | null>(
  null,
);

export function useScreenScroll() {
  return useContext(ScreenScrollContext);
}

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Leave room for the system navigation bar. Use on screens with no tab bar below them. */
  safeBottom?: boolean;
};

export function Screen({ children, className, safeBottom = false }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);

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
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName={cn("gap-4 px-6 pb-8 pt-4", className)}
      >
        <ScreenScrollContext.Provider value={scrollRef}>
          {children}
        </ScreenScrollContext.Provider>
        {safeBottom && <View style={{ height: insets.bottom }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
