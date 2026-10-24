import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

export function usePhotoCapture() {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Denied, and the OS won't show the prompt again: the user must use Settings.
  const cameraBlocked =
    permission !== null && !permission.granted && !permission.canAskAgain;

  const takePhoto = async () => {
    const current = permission?.granted
      ? permission
      : await requestPermission();
    if (!current.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  return { photoUri, cameraBlocked, takePhoto, pickPhoto };
}
