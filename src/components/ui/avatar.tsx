import { Image, View } from "react-native";

import { colors } from "@/constants/colors";
import { AppText } from "./app-text";

type Props = { name: string; uri: string | null; size?: number };

export function Avatar({ name, uri, size = 48 }: Props) {
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`${name}'s photo`}
        style={{ ...dimensions, backgroundColor: colors.primarySoft }}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View
      style={dimensions}
      className="items-center justify-center bg-primary-soft"
    >
      <AppText variant="title" style={{ fontSize: size * 0.38 }}>
        {initials || "?"}
      </AppText>
    </View>
  );
}
