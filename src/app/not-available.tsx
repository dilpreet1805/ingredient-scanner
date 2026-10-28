import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { DevAgeReset } from "@/features/age/dev-age-reset";

export default function NotAvailable() {
  return (
    <Screen safeBottom>
      <Card className="gap-2">
        <AppText variant="title">Not available</AppText>
        <AppText variant="caption" className="text-ink">
          This app isn't available for your age. Thank you for understanding.
        </AppText>
      </Card>
      <DevAgeReset />
    </Screen>
  );
}
