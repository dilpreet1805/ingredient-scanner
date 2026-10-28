import { findAdditiveCodes } from "./additive-codes";
import { lookupAdditive, type FoundAdditive } from "./additive-table";

/** Each code on the label, with our sourced entry or null ("no information yet"). */
export function describeAdditives(ingredientsText: string): FoundAdditive[] {
  return findAdditiveCodes(ingredientsText).map((code) => ({
    code,
    entry: lookupAdditive(code),
  }));
}
