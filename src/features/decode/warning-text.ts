// The server sends short codes. These are the words the user sees.
export function warningText(code: string): string {
  switch (code) {
    case "energy_mismatch":
      return "The calories don't match the other numbers. Check them against the pack.";
    case "values_out_of_range":
      return "Some values look unusual. Check them against the pack.";
    case "incomplete_nutrition":
      return "Some nutrition values couldn't be read.";
    case "sugar_inconsistent":
      return "The sugar values don't add up. Check them against the pack.";
    default:
      // A code added on the server must never break an older app.
      return "Some values may not be read correctly. Check them against the pack.";
  }
}
