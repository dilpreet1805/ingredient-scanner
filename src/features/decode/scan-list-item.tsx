import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import type { ScanResult } from "@/types";

import { additiveLine, scanTitle } from "./scan-text";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function ScanListItem({
  scan,
  isLast,
}: {
  scan: ScanResult;
  isLast: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/decode/[id]", params: { id: scan.id } })
      }
      className={cn(
        "gap-2 py-3 active:opacity-70",
        !isLast && "border-b border-primary-soft",
      )}
    >
      <View className="flex-row items-center gap-3">
        <ProductThumbnail category={scan.category} />
        <View className="flex-1">
          <AppText
            variant="body"
            className="font-body-semibold text-forest"
            numberOfLines={1}
          >
            {scanTitle(scan)}
          </AppText>
          <View className="flex-row items-center gap-1">
            {scan.pinned && (
              <Ionicons name="pin" size={12} color={colors.muted} />
            )}
            <AppText variant="caption">{formatDate(scan.createdAt)}</AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>

      {/* Indented to line up under the product name (48px thumbnail + 12px gap). */}
      <View className="flex-row items-center gap-2 pl-[60px]">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name="leaf-outline" size={14} color={colors.primary} />
        </View>
        <AppText variant="caption" className="flex-1" numberOfLines={1}>
          {additiveLine(scan.ingredientsText)}
        </AppText>
      </View>
    </Pressable>
  );
}
