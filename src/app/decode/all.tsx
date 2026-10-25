import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { ScanListItem } from "@/features/decode/scan-list-item";
import { recentScans } from "@/features/home/fixtures"; // TEMPORARY

export default function AllScans() {
  return (
    <Screen>
      <BackButton />
      <AppText variant="heading">All scans</AppText>
      <AppText variant="caption">
        Your last 10 scans, plus anything you've pinned.
      </AppText>

      <Card>
        {recentScans.length === 0 ? (
          <AppText variant="caption">
            Products you decode will show up here.
          </AppText>
        ) : (
          recentScans.map((scan, index) => (
            <ScanListItem
              key={scan.id}
              scan={scan}
              isLast={index === recentScans.length - 1}
            />
          ))
        )}
      </Card>
    </Screen>
  );
}
