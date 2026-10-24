import { ScrollView, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function Home() {
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="gap-4 p-6 pt-20"
    >
      <AppText variant="heading">Components</AppText>

      <Card className="gap-3">
        <AppText variant="title">Instant Noodles</AppText>
        <AppText variant="caption">Contains E621, E627 and palm oil.</AppText>
        <View className="flex-row gap-2">
          <Badge level="low" />
          <Badge level="moderate" />
          <Badge level="high" />
        </View>
      </Card>

      <Card className="gap-4">
        <AppText variant="title">Today</AppText>

        <View className="gap-1">
          <View className="flex-row justify-between">
            <AppText variant="body">Calories</AppText>
            <AppText variant="caption">1450 / 2000 kcal</AppText>
          </View>
          <ProgressBar value={1450} max={2000} tone="accent" />
        </View>

        <View className="gap-1">
          <View className="flex-row justify-between">
            <AppText variant="body">Protein</AppText>
            <AppText variant="caption">45 / 60 g</AppText>
          </View>
          <ProgressBar value={45} max={60} />
        </View>

        <View className="gap-1">
          <View className="flex-row justify-between">
            <AppText variant="body">Over goal</AppText>
            <AppText variant="caption">230 / 200 g</AppText>
          </View>
          <ProgressBar value={230} max={200} />
        </View>
      </Card>
    </ScrollView>
  );
}
