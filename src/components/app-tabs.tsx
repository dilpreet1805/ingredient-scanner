import { NativeTabs } from "expo-router/native-tabs";

// Native props can't take Tailwind classes, so these hex values
// duplicate our tokens (surface, primary-soft, ink).
const TAB_BG = "#FFFFFF";
const TAB_INDICATOR = "#E1F2E6";
const TAB_LABEL = "#22332A";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={TAB_BG}
      indicatorColor={TAB_INDICATOR}
      labelStyle={{ selected: { color: TAB_LABEL } }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="camera.fill" md="photo_camera" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.fill" md="history" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
