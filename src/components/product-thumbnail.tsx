import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import type { ProductCategory } from "@/types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const categoryStyle: Record<
  ProductCategory,
  { icon: IconName; tone: "primary" | "accent" }
> = {
  noodles: { icon: "noodles", tone: "accent" },
  bread: { icon: "bread-slice", tone: "accent" },
  beverage: { icon: "bottle-soda", tone: "accent" },
  snack: { icon: "cookie", tone: "accent" },
  sweets: { icon: "candy", tone: "accent" },
  dairy: { icon: "cheese", tone: "primary" },
  cereal: { icon: "grain", tone: "primary" },
  sauce: { icon: "chili-hot", tone: "accent" },
  frozen: { icon: "snowflake", tone: "primary" },
  fruit_veg: { icon: "food-apple", tone: "primary" },
  meat_fish: { icon: "food-steak", tone: "accent" },
  spread: { icon: "bowl-mix", tone: "accent" },
  supplement: { icon: "pill", tone: "primary" },
  other: { icon: "food", tone: "primary" },
};

export function ProductThumbnail({ category }: { category: ProductCategory }) {
  const { icon, tone } = categoryStyle[category];

  return (
    <View
      // Decorative: the row's text already names the product.
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className={cn(
        "h-12 w-12 items-center justify-center rounded-2xl",
        tone === "accent" ? "bg-accent-soft" : "bg-primary-soft",
      )}
    >
      <MaterialCommunityIcons
        name={icon}
        size={26}
        color={tone === "accent" ? colors.accent : colors.primary}
      />
    </View>
  );
}
