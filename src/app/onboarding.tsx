import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { useOnboarding } from "@/features/profile/onboarding-state";
import { ProfileForm } from "@/features/profile/profile-form";

export default function Onboarding() {
  const skip = useOnboarding((s) => s.skip);

  // First launch has nothing behind this screen. Opened from the lock card, Back returns to it.
  const finish = () =>
    router.canGoBack() ? router.back() : router.replace("/");

  const skipForNow = () => {
    skip();
    if (router.canGoBack()) router.back();
    else router.replace("/decode");
  };

  return (
    <Screen>
      <View className="gap-1">
        <AppText variant="heading">Welcome</AppText>
        <AppText variant="caption">
          A few details set up your BMI and daily goals. You can change them
          anytime.
        </AppText>
      </View>

      <ProfileForm submitLabel="Create profile" onSaved={finish} />

      <Pressable
        accessibilityRole="button"
        onPress={skipForNow}
        className="min-h-[48px] items-center justify-center active:opacity-70"
      >
        <AppText variant="body" className="font-body-bold text-forest">
          Skip for now and try Decode
        </AppText>
      </Pressable>
      <AppText variant="caption" className="text-center">
        Home and Planner unlock once your profile is created.
      </AppText>
    </Screen>
  );
}
