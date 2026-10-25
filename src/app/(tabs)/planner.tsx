import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { ProfileGate } from "@/features/profile/profile-gate";

export default function Planner() {
  return (
    <ProfileGate>
      {() => (
        <Screen>
          <AppText variant="heading">Planner</AppText>
          <Card className="gap-3">
            <AppText variant="title">No meals planned</AppText>
            <AppText variant="caption">
              Add meals to track calories, carbs and protein.
            </AppText>
            <Button title="Add a meal" variant="soft" />
          </Card>
        </Screen>
      )}
    </ProfileGate>
  );
}
