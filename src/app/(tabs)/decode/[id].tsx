import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { NutritionCard } from "@/features/decode/nutrition-card";
import { ScanDetails } from "@/features/decode/scan-details";
import { scanTitle } from "@/features/decode/scan-text";
import { useScan, useSetPinned } from "@/features/decode/use-scans";
import { warningText } from "@/features/decode/warning-text";

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
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <ProductThumbnail category={scan.category} />
              <View className="flex-1">
                <AppText variant="title" numberOfLines={3}>
                  {scanTitle(scan)}
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
            <AppText variant="caption">
              {scan.confirmed
                ? "You confirmed this matches the pack."
                : "Not confirmed against the pack."}
            </AppText>
          </Card>

          <Card>
            <ScanDetails scan={scan} />
          </Card>

          {scan.nutrition ? (
            <NutritionCard
              nutrition={scan.nutrition}
              servingSize={scan.servingSize}
              note="Values come from the label. This doesn't count as eating it. Log meals in the Planner."
            />
          ) : (
            <Card className="gap-2">
              <AppText variant="title">Nutrition</AppText>
              <AppText variant="caption">
                {scan.category === "supplement"
                  ? "Vitamins and minerals aren't read yet."
                  : "No nutrition facts were read for this scan. Add a photo of them next time to see calories and macros."}
              </AppText>
            </Card>
          )}

          {scan.warnings.length > 0 && (
            <Card className="gap-2 bg-accent-soft">
              {scan.warnings.map((code) => (
                <AppText key={code} variant="caption" className="text-ink">
                  {warningText(code)}
                </AppText>
              ))}
            </Card>
          )}

          {scan.allergenStatements.length > 0 && (
            <Card className="gap-2">
              <AppText variant="title">Allergen information</AppText>
              {scan.allergenStatements.map((line) => (
                <AppText key={line} variant="body">
                  {line}
                </AppText>
              ))}
            </Card>
          )}

          <Card className="gap-2">
            <AppText variant="title">Ingredients</AppText>
            <AppText variant="body">{scan.ingredientsText}</AppText>
          </Card>

          {scan.imageUris.length > 0 && (
            <Card className="gap-3">
              <AppText variant="title">
                {scan.imageUris.length > 1
                  ? "Your label photos"
                  : "Your label photo"}
              </AppText>
              {scan.imageUris.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  resizeMode="contain"
                  accessibilityLabel="Your label photo"
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 16,
                    backgroundColor: colors.primarySoft,
                  }}
                />
              ))}
            </Card>
          )}

          <AppText variant="caption" className="px-1">
            General information based on the label and published sources, not
            medical advice. Talk to a doctor or dietitian about your own needs.
          </AppText>
        </>
      )}
    </Screen>
  );
}
