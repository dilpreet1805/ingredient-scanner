import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { ProfileGate } from "@/features/profile/profile-gate";
import { goalLabel } from "@/features/profile/profile-schema";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/types";

type IconName = keyof typeof Ionicons.glyphMap;

function StatTile(props: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${props.label}: ${props.value}. Edit`}
      onPress={props.onPress}
      className="w-[48%] gap-2 rounded-control bg-canvas p-4 active:opacity-70"
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name={props.icon} size={18} color={colors.primary} />
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </View>
      <View>
        <AppText variant="caption">{props.label}</AppText>
        <AppText variant="body" className="font-body-bold text-forest">
          {props.value}
        </AppText>
      </View>
    </Pressable>
  );
}

function MenuRow(props: {
  icon: IconName;
  title: string;
  subtitle: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!props.onPress}
      accessibilityRole={props.onPress ? "button" : undefined}
      onPress={props.onPress}
      className={cn(
        "flex-row items-center gap-3 py-3",
        !props.isLast && "border-b border-primary-soft",
        props.onPress && "active:opacity-70",
      )}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name={props.icon} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <AppText variant="body" className="font-body-semibold text-forest">
          {props.title}
        </AppText>
        <AppText variant="caption">{props.subtitle}</AppText>
      </View>
      {props.onPress && (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

function Hub({ profile }: { profile: UserProfile }) {
  const age = new Date().getFullYear() - profile.birthYear; // approximate: we only store the year
  const since = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Screen safeBottom>
      <BackButton />
      <View className="gap-1">
        <AppText variant="heading">Profile</AppText>
        <AppText variant="caption">Your health. Your choices.</AppText>
      </View>

      <Card className="gap-4">
        <View className="flex-row items-center gap-4">
          <Avatar name={profile.name} uri={profile.avatarUri} size={72} />
          <View className="flex-1 gap-0.5">
            <AppText variant="title" numberOfLines={1}>
              {profile.name}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {profile.email}
            </AppText>
            <AppText variant="caption">Member since {since}</AppText>
          </View>
        </View>
        <Button
          title="Edit profile"
          variant="soft"
          left={<Ionicons name="pencil" size={16} color={colors.forest} />}
          onPress={() => router.push("/profile/personal")}
        />

        <View className="flex-row flex-wrap justify-between gap-y-3">
          <StatTile
            icon="flag-outline"
            label="Goal"
            value={goalLabel[profile.goal]}
            onPress={() => router.push("/profile/goals")}
          />
          <StatTile
            icon="calendar-outline"
            label="Age"
            value={`${age} years`}
            onPress={() => router.push("/profile/personal")}
          />
          <StatTile
            icon="body-outline"
            label="Height"
            value={`${profile.heightCm} cm`}
            onPress={() => router.push("/profile/personal")}
          />
          <StatTile
            icon="speedometer-outline"
            label="Weight"
            value={`${profile.weightKg} kg`}
            onPress={() => router.push("/profile/personal")}
          />
        </View>
      </Card>

      <Card>
        <MenuRow
          icon="person-outline"
          title="Personal information"
          subtitle="Manage your details"
          onPress={() => router.push("/profile/personal")}
        />
        <MenuRow
          icon="heart-outline"
          title="Health goals"
          subtitle="Set your nutrition goals"
          onPress={() => router.push("/profile/goals")}
        />
        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacy & security"
          subtitle="Control your data"
          onPress={() => router.push("/profile/privacy")}
        />
        <MenuRow
          icon="information-circle-outline"
          title="About app"
          subtitle={`Version ${version}`}
          isLast
        />
      </Card>
    </Screen>
  );
}

export default function ProfileHub() {
  return <ProfileGate>{(profile) => <Hub profile={profile} />}</ProfileGate>;
}
