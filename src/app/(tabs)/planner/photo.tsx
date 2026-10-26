import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";

export default function PhotoEstimate() {
  return (
    <Screen>
      <BackButton />
      <AppText variant="heading">Photo estimate</AppText>

      <Card className="items-center gap-4 py-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name="camera-outline" size={36} color={colors.primary} />
        </View>
        <View className="items-center gap-1 px-4">
          <AppText variant="title">Estimate from a photo</AppText>
          <AppText variant="caption" className="text-center">
            Take a photo of your meal and let AI estimate the nutrition for you.
          </AppText>
        </View>
        <Button
          title="Open camera"
          variant="cta"
          disabled
          className="self-stretch"
        />
        <View className="rounded-full bg-primary-soft px-3 py-1">
          <AppText variant="caption" className="font-body-bold text-forest">
            Coming soon
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
