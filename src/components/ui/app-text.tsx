import { cn } from "@/lib/cn";
import { Text, type TextProps } from "react-native";

type Variant = "heading" | "title" | "body" | "caption" | "button";

const variantClasses: Record<Variant, string> = {
  heading: "font-heading text-3xl text-forest",
  title: "font-body-bold text-xl text-forest",
  body: "font-body text-base text-ink",
  caption: "font-body text-sm text-muted",
  button: "font-body-bold text-base text-ink",
};

type Props = TextProps & { variant?: Variant };

export function AppText({ variant = "body", className, ...rest }: Props) {
  return <Text className={cn(variantClasses[variant], className)} {...rest} />;
}
