import { ScrollView, Text, View } from "react-native";

export default function Home() {
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="gap-4 p-6 pt-20"
    >
      <Text className="text-3xl font-bold text-ink">Palette check</Text>
      <Text className="text-base text-muted">
        If these look right, our tokens work.
      </Text>

      <View className="rounded-card bg-surface p-5">
        <Text className="text-lg font-semibold text-ink">A card</Text>
        <Text className="text-muted">
          White surface on the canvas background.
        </Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-control bg-primary py-4">
          <Text className="font-bold text-white">Primary</Text>
        </View>
        <View className="flex-1 items-center rounded-control bg-accent py-4">
          <Text className="font-bold text-ink">Accent</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 items-center rounded-control bg-risk-low py-3">
          <Text className="font-semibold text-white">Low</Text>
        </View>
        <View className="flex-1 items-center rounded-control bg-risk-mid py-3">
          <Text className="font-semibold text-ink">Moderate</Text>
        </View>
        <View className="flex-1 items-center rounded-control bg-risk-high py-3">
          <Text className="font-semibold text-white">High</Text>
        </View>
      </View>
    </ScrollView>
  );
}
