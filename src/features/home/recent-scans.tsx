import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors } from "@/constants/colors";
import { ScanDetails } from "@/features/decode/scan-details";
import { scanTitle } from "@/features/decode/scan-text";
import { cn } from "@/lib/cn";
import type { ScanResult } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function ScanRow(props: {
  scan: ScanResult;
  isLast: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { scan, isLast, open, onToggle } = props;

  return (
    <Animated.View
      layout={LinearTransition}
      className={cn(!isLast && "border-b border-primary-soft")}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        className="flex-row items-center gap-3 py-3 active:opacity-70"
      >
        <ProductThumbnail category={scan.category} />
        <View className="flex-1">
          <AppText
            variant="body"
            className="font-body-semibold"
            numberOfLines={1}
          >
            {scanTitle(scan)}
          </AppText>
          <AppText variant="caption">{formatDate(scan.createdAt)}</AppText>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.muted}
        />
      </Pressable>

      {open && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="gap-4 pb-4"
        >
          <ScanDetails scan={scan} />
          <Button
            title="Open full report"
            variant="soft"
            onPress={() =>
              router.push({ pathname: "/decode/[id]", params: { id: scan.id } })
            }
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function RecentScans({ scans }: { scans: ScanResult[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <Card className="gap-1">
      <AppText variant="title" className="mb-1">
        Recent scans
      </AppText>

      {scans.length === 0 ? (
        <AppText variant="caption">
          Products you decode will show up here.
        </AppText>
      ) : (
        scans.map((scan, index) => (
          <ScanRow
            key={scan.id}
            scan={scan}
            isLast={index === scans.length - 1}
            open={openId === scan.id}
            onToggle={() =>
              setOpenId((current) => (current === scan.id ? null : scan.id))
            }
          />
        ))
      )}
    </Card>
  );
}
