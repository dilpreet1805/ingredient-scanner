import { Ionicons } from "@expo/vector-icons";
import { Image, Linking, Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  hint: string;
  required?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  uri: string | null;
  cameraBlocked: boolean;
  onTake: () => void;
  onPick: () => void;
  onRemove?: () => void;
};

export function PhotoSlot(props: Props) {
  const {
    title,
    hint,
    required,
    icon,
    uri,
    cameraBlocked,
    onTake,
    onPick,
    onRemove,
  } = props;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="title">{title}</AppText>
        <View
          className={cn(
            "rounded-full px-3 py-1",
            required ? "bg-accent-soft" : "bg-primary-soft",
          )}
        >
          <AppText variant="caption" className="font-body-bold text-ink">
            {required ? "Required" : "Optional"}
          </AppText>
        </View>
      </View>
      <AppText variant="caption">{hint}</AppText>

      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="contain"
          accessibilityLabel={`${title} photo`}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 16,
            backgroundColor: colors.primarySoft,
          }}
        />
      ) : (
        <View className="h-36 items-center justify-center rounded-control bg-primary-soft">
          <Ionicons name={icon} size={36} color={colors.primary} />
        </View>
      )}

      {cameraBlocked && (
        <AppText variant="caption">
          Camera access is off. Turn it on in Settings, or use your gallery.
        </AppText>
      )}

      <View className="flex-row gap-3">
        {cameraBlocked ? (
          <Button
            title="Settings"
            variant="soft"
            className="flex-1"
            onPress={() => Linking.openSettings()}
          />
        ) : (
          <Button
            title={uri ? "Retake" : "Take photo"}
            variant={uri ? "soft" : "cta"}
            className="flex-1"
            onPress={onTake}
          />
        )}
        <Button
          title="Gallery"
          variant="soft"
          className="flex-1"
          onPress={onPick}
        />
      </View>

      {uri && onRemove && (
        <Pressable
          accessibilityRole="button"
          onPress={onRemove}
          className="items-center py-1 active:opacity-70"
        >
          <AppText variant="caption" className="font-body-bold text-forest">
            Remove photo
          </AppText>
        </Pressable>
      )}
    </Card>
  );
}
