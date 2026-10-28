import type { LabelReading } from "./label-reading";

type Panel = NonNullable<LabelReading["nutrition"]>;
type NutrientKey = keyof Panel["values"];

// The order and names shown on screen.
const ROWS: { key: NutrientKey; label: string; unit: string }[] = [
  { key: "energyKcal", label: "Energy", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "carbsG", label: "Carbohydrate", unit: "g" },
  { key: "totalSugarG", label: "Total sugars", unit: "g" },
  { key: "addedSugarG", label: "Added sugars", unit: "g" },
  { key: "polyolG", label: "Polyols", unit: "g" },
  { key: "fibreG", label: "Fibre", unit: "g" },
  { key: "fatG", label: "Total fat", unit: "g" },
  { key: "saturatedFatG", label: "Saturated fat", unit: "g" },
  { key: "transFatG", label: "Trans fat", unit: "g" },
  { key: "cholesterolMg", label: "Cholesterol", unit: "mg" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

export type NutritionRow = { label: string; text: string };

export function basisLabel(panel: Panel, servingSize: string | null): string {
  switch (panel.basis) {
    case "per100g":
      return "Per 100 g";
    case "per100ml":
      return "Per 100 ml";
    case "perServing":
      return servingSize ? `Per serving (${servingSize})` : "Per serving";
  }
}

function formatValue(value: number, lessThan: boolean, unit: string): string {
  if (lessThan && value === 0) return "Trace"; // printed as TRACE or NIL-ish
  if (lessThan) return `< ${value} ${unit}`;
  return `${value} ${unit}`;
}

/** Only the nutrients that were actually read, in a fixed order. */
export function nutritionRows(panel: Panel): NutritionRow[] {
  const rows: NutritionRow[] = [];
  for (const { key, label, unit } of ROWS) {
    const item = panel.values[key];
    if (!item) continue;
    rows.push({ label, text: formatValue(item.value, item.lessThan, unit) });
  }
  return rows;
}
