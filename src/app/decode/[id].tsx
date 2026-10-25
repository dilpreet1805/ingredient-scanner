import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { ScanDetails } from "@/features/decode/scan-details";
import { useScan, useSetPinned } from "@/features/decode/use-scans";
import type { RiskLevel } from "@/types";

// Placeholder wording. Final copy needs care, because this is health-related.
const verdictTitle: Record<RiskLevel, string> = {
  low: "Looks like a good pick",
  moderate: "Fine in moderation",
  high: "Best as an occasional treat",
};

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: scan, isPending } = useScan(id);
  const setPinned = useSetPinned();

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <BackButton />
        {scan && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: scan.pinned }}
            accessibilityLabel={
              scan.pinned ? "Unpin this scan" : "Pin this scan"
            }
            onPress={() =>
              setPinned.mutate({ id: scan.id, pinned: !scan.pinned })
            }
            className="h-11 flex-row items-center gap-2 rounded-full bg-surface px-4 active:opacity-70"
          >
            <Ionicons
              name={scan.pinned ? "pin" : "pin-outline"}
              size={18}
              color={colors.forest}
            />
            <AppText variant="caption" className="font-body-bold text-forest">
              {scan.pinned ? "Pinned" : "Pin"}
            </AppText>
          </Pressable>
        )}
      </View>

      {isPending ? (
        <AppText variant="caption">Loading…</AppText>
      ) : !scan ? (
        <Card className="gap-3">
          <AppText variant="title">We couldn't find that scan</AppText>
          <AppText variant="caption">
            It may have been removed. Go back and try another.
          </AppText>
          <Button
            title="Go back"
            variant="soft"
            onPress={() => router.back()}
          />
        </Card>
      ) : (
        <>
          <Card className="gap-4">
            <View className="flex-row items-center gap-3">
              <ProductThumbnail category={scan.category} />
              <View className="flex-1">
                <AppText variant="title" numberOfLines={2}>
                  {scan.productName ?? "Unnamed product"}
                </AppText>
                <AppText variant="caption">
                  {new Date(scan.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </AppText>
              </View>
            </View>

            <View className="gap-2 rounded-control bg-canvas p-4">
              <Badge level={scan.overallRisk} />
              <AppText variant="title">
                {verdictTitle[scan.overallRisk]}
              </AppText>
              <AppText variant="caption">{scan.summary}</AppText>
            </View>
          </Card>

          <Card>
            <ScanDetails scan={scan} />
          </Card>

          <Card className="gap-3">
            <AppText variant="title">Nutrition per 100 g</AppText>
            {scan.nutritionPer100g ? (
              <View className="gap-2">
                {(
                  [
                    ["Calories", `${scan.nutritionPer100g.calories} kcal`],
                    ["Carbs", `${scan.nutritionPer100g.carbsG} g`],
                    ["Protein", `${scan.nutritionPer100g.proteinG} g`],
                    ["Fat", `${scan.nutritionPer100g.fatG} g`],
                  ] as const
                ).map(([label, value]) => (
                  <View
                    key={label}
                    className="flex-row items-center justify-between border-b border-primary-soft pb-2"
                  >
                    <AppText variant="body">{label}</AppText>
                    <AppText
                      variant="body"
                      className="font-body-bold text-forest"
                    >
                      {value}
                    </AppText>
                  </View>
                ))}
                <AppText variant="caption">
                  Values come from the label. This doesn't count as eating it.
                  Log meals in the Planner.
                </AppText>
              </View>
            ) : (
              <AppText variant="caption">
                No nutrition photo was added for this scan. Add one next time to
                see calories and macros.
              </AppText>
            )}
          </Card>

          {scan.imageUri && (
            <Card className="gap-3">
              <AppText variant="title">Your label photo</AppText>
              <Image
                source={{ uri: scan.imageUri }}
                resizeMode="contain"
                accessibilityLabel="Your label photo"
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 16,
                  backgroundColor: colors.primarySoft,
                }}
              />
            </Card>
          )}

          <Card className="gap-3">
            <AppText variant="title">Ingredients</AppText>
            <View className="flex-row flex-wrap gap-2">
              {scan.ingredients.map((item) => (
                <View
                  key={item}
                  className="rounded-full bg-primary-soft px-3 py-1"
                >
                  <AppText variant="caption" className="text-ink">
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>

          <AppText variant="caption" className="px-1">
            General information based on the label, not medical advice. Talk to
            a doctor or dietitian about your own needs.
          </AppText>
        </>
      )}
    </Screen>
  );
}
