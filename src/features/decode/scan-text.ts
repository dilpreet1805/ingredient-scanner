import { findAdditiveCodes } from "../additives/additive-codes";

/** Brand and product name as one title. Never repeats the brand when the name already starts with it. */
export function scanTitle(scan: {
  brand: string | null;
  productName: string | null;
}): string {
  const brand = scan.brand?.trim() ?? "";
  const name = scan.productName?.trim() ?? "";
  if (!brand && !name) return "Unnamed product";
  if (!brand) return name;
  if (!name) return brand;
  return name.toLowerCase().startsWith(brand.toLowerCase())
    ? name
    : `${brand} ${name}`;
}

/** The one-line summary under a product in lists. It states a count, never a judgement. */
export function additiveLine(ingredientsText: string): string {
  const count = findAdditiveCodes(ingredientsText).length;
  if (count === 0) return "No additive codes found";
  return count === 1 ? "1 additive code" : `${count} additive codes`;
}
