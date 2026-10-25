import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { ScanListItem } from "@/features/decode/scan-list-item";
import { useScans } from "@/features/decode/use-scans";

export default function AllScans() {
  const { data: scans = [] } = useScans();
  return (
    <Screen>
      <BackButton />
      <AppText variant="heading">All scans</AppText>
      <AppText variant="caption">
        Your last 10 scans, plus anything you've pinned.
      </AppText>

      <Card>
        {scans.length === 0 ? (
          <AppText variant="caption">
            Products you decode will show up here.
          </AppText>
        ) : (
          scans.map((scan, index) => (
            <ScanListItem
              key={scan.id}
              scan={scan}
              isLast={index === scans.length - 1}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
