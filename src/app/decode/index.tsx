import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Linking, Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { ScanListItem } from "@/features/decode/scan-list-item";
import { TipsSheet } from "@/features/decode/tips-sheet";
import { usePhotoCapture } from "@/features/decode/use-photo-capture";
import { recentScans } from "@/features/home/fixtures"; // TEMPORARY: real storage in Step 3

export default function Decode() {
  const { cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();
  const [tipsOpen, setTipsOpen] = useState(false);

  const start = async (source: "camera" | "gallery") => {
    const uri = source === "camera" ? await takePhoto() : await pickPhoto();
    if (uri)
      router.push({
        pathname: "/decode/capture",
        params: { ingredientsUri: uri },
      });
  };

  const visible = recentScans.slice(0, 3);

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="heading">Decode</AppText>
        <AppText variant="caption">
          Check what's inside. Make healthier choices.
        </AppText>
      </View>

      <Card className="p-3">
        <View className="gap-4 rounded-card bg-primary-soft p-4">
          <View className="flex-row items-start">
            <View className="flex-1 gap-2 pr-2">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-surface">
                <Ionicons name="leaf" size={24} color={colors.primary} />
              </View>
              <AppText variant="heading" className="text-2xl">
                Decode a product
              </AppText>
              <AppText variant="caption">
                Take a photo of the ingredient list to see what's really inside.
              </AppText>
            </View>
            <Image
              source={require("@/assets/images/decode-scan.png")}
              resizeMode="contain"
              accessible={false}
              style={{ width: 140, aspectRatio: 1 }}
            />
          </View>

          {cameraBlocked ? (
            <View className="gap-3">
              <AppText variant="caption">
                Camera access is turned off. Turn it on in Settings, or choose a
                photo from your gallery.
              </AppText>
              <Button
                title="Open settings"
                variant="cta"
                onPress={() => Linking.openSettings()}
              />
            </View>
          ) : (
            <Button
              title="Open Camera"
              variant="cta"
              left={
                <Ionicons name="camera-outline" size={22} color="#FFFFFF" />
              }
              right={
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              }
              onPress={() => start("camera")}
            />
          )}

          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-muted/30" />
            <AppText variant="caption">or</AppText>
            <View className="h-px flex-1 bg-muted/30" />
          </View>

          <Button
            title="Choose from gallery"
            variant="soft"
            className="bg-surface"
            left={
              <Ionicons name="image-outline" size={22} color={colors.forest} />
            }
            onPress={() => start("gallery")}
          />
        </View>
      </Card>

      <Card className="gap-1">
        <View className="mb-1 flex-row items-center justify-between">
          <AppText variant="title">Recent scans</AppText>
          {recentScans.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/decode/all")}
              className="flex-row items-center gap-1 active:opacity-70"
            >
              <AppText variant="caption">View all</AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {visible.length === 0 ? (
          <AppText variant="caption">
            Products you decode will show up here.
          </AppText>
        ) : (
          visible.map((scan, index) => (
            <ScanListItem
              key={scan.id}
              scan={scan}
              isLast={index === visible.length - 1}
            />
          ))
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => setTipsOpen(true)}
          className="mt-2 flex-row items-center gap-3 rounded-control bg-primary-soft p-3 active:opacity-80"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Ionicons name="bulb-outline" size={22} color={colors.primary} />
          </View>
          <AppText variant="caption" className="flex-1 text-ink">
            <AppText variant="caption" className="font-body-bold text-forest">
              Tip:{" "}
            </AppText>
            For best results, make sure the ingredient list is clearly visible
            and well lit.
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </Card>

      <TipsSheet visible={tipsOpen} onClose={() => setTipsOpen(false)} />
    </Screen>
  );
}
