import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { colors } from "@/constants/colors";

const tips: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  {
    icon: "sunny-outline",
    text: "Use good light and avoid glare on shiny packaging.",
  },
  {
    icon: "scan-outline",
    text: "Hold the phone steady so the text stays sharp.",
  },
  {
    icon: "document-text-outline",
    text: "Include the whole ingredient list, not just part of it.",
  },
  {
    icon: "nutrition-outline",
    text: "Add a photo of the nutrition facts too, to see calories and macros.",
  },
];

export function TipsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Tapping the dimmed area closes the sheet. */}
      <Pressable
        accessibilityLabel="Close tips"
        onPress={onClose}
        className="flex-1 justify-end bg-black/40"
      >
        {/* This inner Pressable swallows taps so they don't reach the backdrop. */}
        <Pressable
          onPress={() => {}}
          className="gap-4 rounded-t-card bg-surface p-6 pb-10"
        >
          <AppText variant="title">For a clear result</AppText>
          {tips.map((tip) => (
            <View key={tip.text} className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
                <Ionicons name={tip.icon} size={18} color={colors.primary} />
              </View>
              <AppText variant="caption" className="flex-1 text-ink">
                {tip.text}
              </AppText>
            </View>
          ))}
          <Button title="Got it" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
