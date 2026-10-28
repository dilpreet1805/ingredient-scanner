import { NativeTabs } from "expo-router/native-tabs";

import { colors } from "@/constants/colors";

import { useAgeStore } from "@/features/age/age-store";

export default function AppTabs() {
  const isTeen = useAgeStore((s) => s.tier === "teen");
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.primarySoft}
      labelStyle={{ selected: { color: colors.ink } }}
    >
      <NativeTabs.Trigger name="index" hidden={isTeen}>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="decode">
        <NativeTabs.Trigger.Label>Decode</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="doc.text.viewfinder"
          md="document_scanner"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner" hidden={isTeen}>
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
