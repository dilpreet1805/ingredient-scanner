import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";

export default function Scan() {
  return (
    <Screen>
      <AppText variant="heading">Scan</AppText>
      <Card className="gap-3">
        <AppText variant="title">Check a product</AppText>
        <AppText variant="caption">
          Take a photo of the ingredient list to see what's in it.
        </AppText>
        <Button title="Scan ingredients" variant="accent" />
      </Card>
    </Screen>
  );
}
