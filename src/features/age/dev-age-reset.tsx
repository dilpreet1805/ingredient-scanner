import { DevSettings, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { useAgeStore } from "./age-store";

// Development only: renders nothing in release builds.
export function DevAgeReset() {
  const tier = useAgeStore((s) => s.tier);
  if (!__DEV__) return null;

  const resetAndReload = async () => {
    await useAgeStore.getState().reset();
    DevSettings.reload();
  };

  return (
    <View className="gap-2">
      <AppText variant="caption">Dev only. Age state: {tier}</AppText>
      <Button
        title="Dev: reset age and reload app"
        variant="soft"
        onPress={resetAndReload}
      />
    </View>
  );
}
