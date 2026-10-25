import * as ImagePicker from "expo-image-picker";

const baseOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  quality: 0.7,
};

const squareOptions: ImagePicker.ImagePickerOptions = {
  ...baseOptions,
  allowsEditing: true,
  aspect: [1, 1],
};

type CaptureOptions = { square?: boolean };

export function usePhotoCapture() {
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();

  const cameraBlocked =
    permission !== null && !permission.granted && !permission.canAskAgain;

  /** Returns the photo's URI, or null if the user cancelled or denied permission. */
  const takePhoto = async (opts?: CaptureOptions): Promise<string | null> => {
    const current = permission?.granted
      ? permission
      : await requestPermission();
    if (!current.granted) return null;
    const result = await ImagePicker.launchCameraAsync(
      opts?.square ? squareOptions : baseOptions,
    );
    return result.canceled ? null : result.assets[0].uri;
  };

  const pickPhoto = async (opts?: CaptureOptions): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync(
      opts?.square ? squareOptions : baseOptions,
    );
    return result.canceled ? null : result.assets[0].uri;
  };

  return { cameraBlocked, takePhoto, pickPhoto };
}
