import { NativeTabs } from "expo-router/native-tabs";

import { colors } from "@/constants/colors";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.primarySoft}
      labelStyle={{ selected: { color: colors.ink } }}
    >
      <NativeTabs.Trigger name="index">
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

      <NativeTabs.Trigger name="planner">
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
