import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function Home() {
  return (
    <Screen>
      <AppText variant="heading">Today</AppText>
      <Card className="gap-1">
        <AppText variant="title">Nothing logged yet</AppText>
        <AppText variant="caption">
          Plan a meal or scan a product to start your day.
        </AppText>
      </Card>
    </Screen>
  );
}
