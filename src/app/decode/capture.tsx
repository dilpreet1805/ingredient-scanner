import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { PhotoSlot } from "@/features/decode/photo-slot";
import { usePhotoCapture } from "@/features/decode/use-photo-capture";
import { recentScans } from "@/features/home/fixtures"; // TEMPORARY

// TEMPORARY: flip to true to preview the error state until the real AI exists.
const SIMULATE_ERROR = false;

type Source = "camera" | "gallery";

export default function Capture() {
  const { ingredientsUri } = useLocalSearchParams<{
    ingredientsUri?: string;
  }>();
  const { cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();

  const [ingredients, setIngredients] = useState<string | null>(
    ingredientsUri ?? null,
  );
  const [nutrition, setNutrition] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = async (source: Source, set: (uri: string) => void) => {
    const uri = source === "camera" ? await takePhoto() : await pickPhoto();
    if (uri) {
      set(uri);
      setError(null);
    }
  };

  // TEMPORARY: pretends to analyse. The real AI call replaces this in Step 6.
  const decode = () => {
    setDecoding(true);
    setError(null);
    setTimeout(() => {
      setDecoding(false);
      if (SIMULATE_ERROR) {
        setError(
          "We couldn't read the ingredient list. Try a sharper photo with better light.",
        );
        return;
      }
      router.push({
        pathname: "/decode/[id]",
        params: { id: recentScans[0].id },
      });
    }, 1500);
  };

  return (
    <Screen>
      <BackButton />

      <View className="gap-1">
        <AppText variant="heading">Add photos</AppText>
        <AppText variant="caption">
          The ingredient list is enough. Add nutrition facts for calories and
          macros.
        </AppText>
      </View>

      <PhotoSlot
        title="Ingredient list"
        hint="Fit the whole list in the frame and keep the text sharp."
        required
        icon="document-text-outline"
        uri={ingredients}
        cameraBlocked={cameraBlocked}
        onTake={() => capture("camera", setIngredients)}
        onPick={() => capture("gallery", setIngredients)}
      />

      <PhotoSlot
        title="Nutrition facts"
        hint="Usually on another side of the pack. Values are per 100 g."
        icon="nutrition-outline"
        uri={nutrition}
        cameraBlocked={cameraBlocked}
        onTake={() => capture("camera", setNutrition)}
        onPick={() => capture("gallery", setNutrition)}
        onRemove={() => setNutrition(null)}
      />

      {error && (
        <Card className="flex-row items-start gap-3 bg-accent-soft">
          <Ionicons name="alert-circle" size={22} color={colors.accentStrong} />
          <View className="flex-1 gap-1">
            <AppText variant="body" className="font-body-bold text-forest">
              Couldn't decode this photo
            </AppText>
            <AppText variant="caption" className="text-ink">
              {error}
            </AppText>
          </View>
        </Card>
      )}

      <Button
        title="Decode ingredients"
        variant="cta"
        disabled={!ingredients}
        loading={decoding}
        onPress={decode}
      />
      {!ingredients && (
        <AppText variant="caption" className="text-center">
          Add the ingredient list photo to continue.
        </AppText>
      )}
    </Screen>
  );
}
