import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/app-text";
import { Avatar } from "@/components/ui/avatar";
import { colors } from "@/constants/colors";
import type { UserProfile } from "@/types";

type Destination = "/profile" | "/profile/goals" | "/profile/privacy";

const items: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Destination;
}[] = [
  { label: "My profile", icon: "person-outline", href: "/profile" },
  { label: "Health goals", icon: "heart-outline", href: "/profile/goals" },
  {
    label: "Privacy & security",
    icon: "shield-checkmark-outline",
    href: "/profile/privacy",
  },
];

export function AvatarMenu({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const go = (href: Destination) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        className="active:opacity-80"
      >
        <Avatar name={profile.name} uri={profile.avatarUri} size={48} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setOpen(false)}
          className="flex-1 bg-black/20"
        >
          {/* Sits just under the header avatar: safe area + 16px screen padding + 48px avatar + 8px gap. */}
          <Pressable
            onPress={() => {}}
            className="absolute right-6 w-64 rounded-card bg-surface p-2"
            style={{ top: insets.top + 72, elevation: 8 }}
          >
            <View className="flex-row items-center gap-3 p-3">
              <Avatar name={profile.name} uri={profile.avatarUri} size={40} />
              <View className="flex-1">
                <AppText
                  variant="body"
                  className="font-body-bold text-forest"
                  numberOfLines={1}
                >
                  {profile.name}
                </AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {profile.email}
                </AppText>
              </View>
            </View>
            <View className="my-1 h-px bg-primary-soft" />
            {items.map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                onPress={() => go(item.href)}
                className="min-h-[48px] flex-row items-center gap-3 rounded-control px-3 active:bg-primary-soft"
              >
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <AppText variant="body">{item.label}</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
