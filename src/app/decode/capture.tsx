import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { useCaptureDraft } from "@/features/decode/capture-draft";
import { AnalysisError, analyzeLabel } from "@/features/decode/fake-analysis";
import { PhotoSlot } from "@/features/decode/photo-slot";
import { usePhotoCapture } from "@/features/decode/use-photo-capture";
import { useCreateScan } from "@/features/decode/use-scans";

type Source = "camera" | "gallery";

export default function Capture() {
  const { cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();
  const createScan = useCreateScan();

  const ingredients = useCaptureDraft((s) => s.ingredientsUri);
  const nutrition = useCaptureDraft((s) => s.nutritionUri);
  const setIngredients = useCaptureDraft((s) => s.setIngredients);
  const setNutrition = useCaptureDraft((s) => s.setNutrition);
  const reset = useCaptureDraft((s) => s.reset);

  const [decoding, setDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = async (source: Source, set: (uri: string | null) => void) => {
    const uri = source === "camera" ? await takePhoto() : await pickPhoto();
    if (uri) {
      set(uri);
      setError(null);
    }
  };

  const decode = async () => {
    if (!ingredients) return;
    setDecoding(true);
    setError(null);
    try {
      const photos = { ingredientsUri: ingredients, nutritionUri: nutrition };
      const analysis = await analyzeLabel(photos);
      const id = await createScan.mutateAsync({ analysis, photos });
      reset();
      // replace, so Back from the report goes to Decode, not to this screen.
      router.replace({ pathname: "/decode/[id]", params: { id } });
    } catch (e) {
      setError(
        e instanceof AnalysisError
          ? e.message
          : "Something went wrong while saving this scan. Please try again.",
      );
    } finally {
      setDecoding(false);
    }
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
