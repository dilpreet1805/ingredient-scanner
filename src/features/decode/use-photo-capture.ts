import * as ImagePicker from "expo-image-picker";

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.7,
};

export function usePhotoCapture() {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();

  const cameraBlocked =
    permission !== null && !permission.granted && !permission.canAskAgain;

  /** Returns the photo's URI, or null if the user cancelled or denied permission. */
  const takePhoto = async (): Promise<string | null> => {
    const current = permission?.granted
      ? permission
      : await requestPermission();
    if (!current.granted) return null;
    const result = await ImagePicker.launchCameraAsync(options);
    return result.canceled ? null : result.assets[0].uri;
  };

  const pickPhoto = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync(options);
    return result.canceled ? null : result.assets[0].uri;
  };

  return { cameraBlocked, takePhoto, pickPhoto };
}
