import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine class names, then resolve Tailwind conflicts (last one wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
