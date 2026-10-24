import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ScanSummary } from "./fixtures";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function RecentScans({ scans }: { scans: ScanSummary[] }) {
  return (
    <Card className="gap-1">
      <AppText variant="title" className="mb-2">
        Recent scans
      </AppText>

      {scans.length === 0 ? (
        <AppText variant="caption">
          Products you scan will show up here.
        </AppText>
      ) : (
        scans.map((scan, index) => (
          <View
            key={scan.id}
            className={cn(
              "flex-row items-center justify-between py-3",
              index < scans.length - 1 && "border-b border-primary-soft",
            )}
          >
            <View className="flex-1 pr-3">
              <AppText
                variant="body"
                className="font-body-semibold"
                numberOfLines={1}
              >
                {scan.productName ?? "Unnamed product"}
              </AppText>
              <AppText variant="caption">{formatDate(scan.createdAt)}</AppText>
            </View>
            <Badge level={scan.overallRisk} />
          </View>
        ))
      )}
    </Card>
  );
}
