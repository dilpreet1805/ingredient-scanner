import { router } from "expo-router";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Screen } from "@/components/ui/screen";
import { ProfileForm } from "@/features/profile/profile-form";
import { ProfileGate } from "@/features/profile/profile-gate";

export default function PersonalInformation() {
  return (
    <ProfileGate>
      {(profile) => (
        <Screen>
          <BackButton />
          <AppText variant="heading">Personal information</AppText>
          <ProfileForm
            initial={profile}
            submitLabel="Save changes"
            onSaved={() => router.back()}
          />
        </Screen>
      )}
    </ProfileGate>
  );
}
