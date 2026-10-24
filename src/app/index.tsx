import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const fakeScan = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="gap-4 p-6 pt-20"
    >
      <AppText variant="heading">Components</AppText>
      <AppText variant="caption">Tap the buttons to test them.</AppText>

      <View className="gap-3 rounded-card bg-surface p-5">
        <AppText variant="title">Buttons</AppText>
        <Button
          title="Primary"
          onPress={() => Alert.alert("Primary pressed")}
        />
        <Button
          title="Scan ingredients"
          variant="accent"
          loading={loading}
          onPress={fakeScan}
        />
        <Button
          title="Soft"
          variant="soft"
          onPress={() => Alert.alert("Soft pressed")}
        />
        <Button title="Disabled" disabled />
      </View>
    </ScrollView>
  );
}
