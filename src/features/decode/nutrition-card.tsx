import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import type { ScanNutrition } from "@/types";

import { basisLabel, nutritionRows } from "./nutrition-rows";

export function NutritionCard(props: {
  nutrition: ScanNutrition;
  servingSize: string | null;
  note: string;
}) {
  return (
    <Card className="gap-2">
      <AppText variant="title">
        {basisLabel(props.nutrition, props.servingSize)}
      </AppText>
      {nutritionRows(props.nutrition).map((row) => (
        <View
          key={row.label}
          className="flex-row items-center justify-between border-b border-primary-soft pb-2"
        >
          <AppText variant="body">{row.label}</AppText>
          <AppText variant="body" className="font-body-bold text-forest">
            {row.text}
          </AppText>
        </View>
      ))}
      <AppText variant="caption">{props.note}</AppText>
    </Card>
  );
}
