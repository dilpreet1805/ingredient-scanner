import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, Pressable, View, type AlertButton } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { colors } from "@/constants/colors";
import { usePhotoCapture } from "@/features/decode/use-photo-capture";
import type { UserProfile } from "@/types";
import {
    DEFAULT_GOALS,
    emptyPersonalValues,
    goalOptions,
    personalSchema,
    personalValuesToInput,
    profileToPersonalValues,
    type PersonalValues,
} from "./profile-schema";
import { useSaveProfile } from "./use-profile";

type Props = {
  initial?: UserProfile | null;
  submitLabel: string;
  onSaved: () => void;
};

export function ProfileForm({ initial, submitLabel, onSaved }: Props) {
  const save = useSaveProfile();
  const { cameraBlocked, takePhoto, pickPhoto } = usePhotoCapture();
  const [avatarUri, setAvatarUri] = useState<string | null>(
    initial?.avatarUri ?? null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: initial
      ? profileToPersonalValues(initial)
      : emptyPersonalValues,
  });

  const name = useWatch({ control, name: "name" });

  const changePhoto = () => {
    const buttons: AlertButton[] = [];
    if (!cameraBlocked) {
      buttons.push({
        text: "Take photo",
        onPress: async () => {
          const uri = await takePhoto({ square: true });
          if (uri) setAvatarUri(uri);
        },
      });
    }
    buttons.push({
      text: "Choose from gallery",
      onPress: async () => {
        const uri = await pickPhoto({ square: true });
        if (uri) setAvatarUri(uri);
      },
    });
    if (avatarUri) {
      buttons.push({
        text: "Remove photo",
        style: "destructive",
        onPress: () => setAvatarUri(null),
      });
    }
    Alert.alert("Profile photo", undefined, buttons, { cancelable: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await save.mutateAsync(
        personalValuesToInput(
          values,
          avatarUri,
          initial?.dailyGoals ?? DEFAULT_GOALS,
        ),
      );
      onSaved();
    } catch {
      setSaveError("We couldn't save your profile. Please try again.");
    }
  });

  return (
    <View className="gap-4">
      <Card className="gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={changePhoto}
          className="items-center gap-2 self-center active:opacity-80"
        >
          <View>
            <Avatar name={name} uri={avatarUri} size={96} />
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </View>
          </View>
          <AppText variant="caption">
            {avatarUri ? "Change photo" : "Add a photo (optional)"}
          </AppText>
        </Pressable>

        <FormField
          control={control}
          name="name"
          label="Name"
          error={errors.name?.message}
          autoCapitalize="words"
          autoComplete="name"
          placeholder="Your name"
        />
        <FormField
          control={control}
          name="email"
          label="Email"
          error={errors.email?.message}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          placeholder="you@example.com"
          hint="Used for receipts and account messages."
        />
        <FormField
          control={control}
          name="birthYear"
          label="Birth year"
          error={errors.birthYear?.message}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="e.g. 1998"
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              control={control}
              name="heightCm"
              label="Height (cm)"
              error={errors.heightCm?.message}
              keyboardType="decimal-pad"
              placeholder="172"
            />
          </View>
          <View className="flex-1">
            <FormField
              control={control}
              name="weightKg"
              label="Weight (kg)"
              error={errors.weightKg?.message}
              keyboardType="decimal-pad"
              placeholder="70"
            />
          </View>
        </View>

        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <View className="gap-1.5">
              <AppText
                variant="body"
                className="font-body-semibold text-forest"
              >
                Your goal
              </AppText>
              <SegmentedControl
                label="Your goal"
                options={goalOptions}
                value={field.value}
                onChange={field.onChange}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="newsletterOptIn"
          render={({ field }) => (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value }}
              onPress={() => field.onChange(!field.value)}
              className="flex-row items-start gap-3 py-1"
            >
              <Ionicons
                name={field.value ? "checkbox" : "square-outline"}
                size={24}
                color={field.value ? colors.primary : colors.muted}
              />
              <AppText variant="caption" className="flex-1 text-ink">
                Send me nutrition tips and product updates by email. You can
                turn this off anytime.
              </AppText>
            </Pressable>
          )}
        />
      </Card>

      {saveError && (
        <Card className="bg-accent-soft">
          <AppText variant="caption" className="text-ink">
            {saveError}
          </AppText>
        </Card>
      )}

      <Button
        title={submitLabel}
        variant="cta"
        loading={save.isPending}
        onPress={() => onSubmit()}
      />

      <AppText variant="caption" className="px-1 text-center">
        BMI and calorie targets are general guides, not medical advice.
      </AppText>
    </View>
  );
}
