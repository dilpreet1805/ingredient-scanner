import { AdditiveList } from "@/features/additives/additive-list";
import type { ScanResult } from "@/types";

// Shown on the Home list and on the report. The old Benefits and Things to watch lists are gone:
// everything we say now comes from the additive table, with its sources.
export function ScanDetails({ scan }: { scan: ScanResult }) {
  return <AdditiveList ingredientsText={scan.ingredientsText} />;
}
