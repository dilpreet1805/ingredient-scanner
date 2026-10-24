import { Image, Linking, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { usePhotoCapture } from "@/features/scan/use-photo-capture";

export default function Scan() {
  const { photoUri, cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();

  return (
    <Screen>
      <AppText variant="heading">Scan</AppText>

      <Card className="gap-4">
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            resizeMode="contain"
            className="h-72 w-full rounded-control bg-primary-soft"
          />
        ) : (
          <View className="h-72 items-center justify-center gap-1 rounded-control bg-primary-soft px-6">
            <AppText variant="title" className="text-center">
              No photo yet
            </AppText>
            <AppText variant="caption" className="text-center">
              Fill the frame with the ingredient list and keep the text sharp.
            </AppText>
          </View>
        )}

        {cameraBlocked ? (
          <View className="gap-3">
            <AppText variant="caption">
              Camera access is turned off. Turn it on in Settings to take
              photos.
            </AppText>
            <Button
              title="Open settings"
              onPress={() => Linking.openSettings()}
            />
          </View>
        ) : (
          <Button
            title={photoUri ? "Retake photo" : "Take photo"}
            variant="accent"
            onPress={takePhoto}
          />
        )}

        <Button
          title="Choose from gallery"
          variant="soft"
          onPress={pickPhoto}
        />
      </Card>
    </Screen>
  );
}
