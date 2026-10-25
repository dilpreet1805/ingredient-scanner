import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";

import { colors } from "@/constants/colors";

export function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => router.back()}
      className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-70"
    >
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  );
}
