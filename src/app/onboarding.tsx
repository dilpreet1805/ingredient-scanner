import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import { useAgeStore } from "@/features/age/age-store";
import { DobStep } from "@/features/age/dob-step";
import { ProfileForm } from "@/features/profile/profile-form";
import { resetTo } from "@/lib/navigation";

export default function Onboarding() {
  const tier = useAgeStore((s) => s.tier);

  return (
    <Screen safeBottom>
      {tier === "adult" ? (
        <>
          <View className="gap-1">
            <AppText variant="heading">Create your profile</AppText>
            <AppText variant="caption">
              A few details set up your BMI and daily goals. You can change them
              anytime.
            </AppText>
          </View>
          <ProfileForm
            submitLabel="Create profile"
            onSaved={() => resetTo("/")}
          />
        </>
      ) : (
        <DobStep />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => resetTo("/decode")}
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
