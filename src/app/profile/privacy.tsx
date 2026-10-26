import { router } from "expo-router";
import { Alert, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useDeleteAllData } from "@/features/profile/use-profile";

export default function PrivacyAndSecurity() {
  const deleteAll = useDeleteAllData();

  const confirmDelete = () => {
    Alert.alert(
      "Delete all your data?",
      "This removes your profile, saved scans and photos from this phone. It can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () =>
            deleteAll.mutate(undefined, {
              onSuccess: () => router.replace("/"),
              onError: () =>
                Alert.alert("Couldn't delete your data", "Please try again."),
            }),
        },
      ],
    );
  };

  return (
    <Screen safeBottom>
      <BackButton />
      <AppText variant="heading">Privacy & security</AppText>

      {/* TODO: update this wording when AI analysis (Step 6) and accounts (Step 8) send data off the phone. */}
      <Card className="gap-2">
        <AppText variant="title">What's on this phone</AppText>
        <AppText variant="caption" className="text-ink">
          Your profile details, the products you've decoded and the photos you
          took are stored only on this phone right now.
        </AppText>
      </Card>

      <Card className="gap-3">
        <View className="gap-1">
          <AppText variant="title">Delete my data</AppText>
          <AppText variant="caption">
            Removes your profile, saved scans and photos from this phone.
          </AppText>
        </View>
        <Button
          title="Delete all my data"
          variant="soft"
          loading={deleteAll.isPending}
          onPress={confirmDelete}
        />
      </Card>
    </Screen>
  );
}
