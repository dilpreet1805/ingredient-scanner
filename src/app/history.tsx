import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function History() {
  return (
    <Screen>
      <AppText variant="heading">History</AppText>
      <Card className="gap-1">
        <AppText variant="title">No scans yet</AppText>
        <AppText variant="caption">
          Products you scan will be saved here.
        </AppText>
      </Card>
    </Screen>
  );
}
