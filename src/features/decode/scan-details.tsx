import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Badge } from "@/components/ui/badge";
import { colors } from "@/constants/colors";
import type { ScanResult } from "@/types";

function DetailList(props: {
  title: string;
  items: string[];
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  const { title, items, icon, color } = props;
  if (items.length === 0) return null;

  return (
    <View className="gap-2">
      <AppText variant="body" className="font-body-bold text-forest">
        {title}
      </AppText>
      {items.map((item) => (
        <View key={item} className="flex-row gap-2 pr-2">
          <Ionicons
            name={icon}
            size={18}
            color={color}
            style={{ marginTop: 2 }}
          />
          <AppText variant="caption" className="flex-1 text-ink">
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function ScanDetails({ scan }: { scan: ScanResult }) {
  return (
    <View className="gap-4">
      <DetailList
        title="Benefits"
        items={scan.benefits}
        icon="checkmark-circle"
        color={colors.primary}
      />
      <DetailList
        title="Things to watch"
        items={scan.concerns}
        icon="alert-circle"
        color={colors.accent}
      />

      {scan.additives.length > 0 && (
        <View className="gap-3">
          <AppText variant="body" className="font-body-bold text-forest">
            Additives
          </AppText>
          {scan.additives.map((a) => (
            <View key={a.code} className="gap-1 rounded-control bg-canvas p-3">
              <View className="flex-row items-center justify-between gap-2">
                <AppText variant="body" className="flex-1 font-body-semibold">
                  {a.code} · {a.name}
                </AppText>
                <Badge level={a.riskLevel} />
              </View>
              <AppText variant="caption" className="text-ink">
                {a.purpose}
              </AppText>
              <AppText variant="caption">
                {a.sideEffects.length === 0
                  ? "No known side effects at normal amounts."
                  : a.sideEffects.join(" ")}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
