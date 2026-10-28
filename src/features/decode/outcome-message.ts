import type { DecodeResult } from "./decode-api";

// Every outcome except a successful read. A read goes to the review screen instead.
export type FailedDecode = Exclude<DecodeResult, { kind: "read" }>;

export type OutcomeMessage = {
  title: string;
  body: string;
  // true when taking another photo is the sensible next action
  canRetake: boolean;
};

export function outcomeMessage(result: FailedDecode): OutcomeMessage {
  switch (result.kind) {
    case "not_a_label":
      return {
        title: "No label found",
        body: "We couldn't find a food or supplement label in this photo. Hold the phone straight above the ingredient list and take it again.",
        canRetake: true,
      };
    case "daily_limit":
      return {
        title: "Daily limit reached",
        body: "You've used all of today's decodes. Your limit resets tomorrow.",
        canRetake: false,
      };
    case "capacity":
      return {
        title: "Busy right now",
        body: "Decode is very busy at the moment. Try again in a few minutes.",
        canRetake: false,
      };
    case "unavailable":
      return {
        title: "Decode isn't available",
        body: "The service can't be reached right now. Your decode was not used. Try again in a little while.",
        canRetake: false,
      };
    case "rejected":
      return {
        title: "Photo not accepted",
        body: "This photo couldn't be used. Take a new, clear photo of the label.",
        canRetake: true,
      };
    case "auth":
      return {
        title: "Please reopen the app",
        body: "Your session has expired. Close the app, open it again, and try once more.",
        canRetake: false,
      };
    case "offline":
      return {
        title: "No internet connection",
        body: "Connect to Wi-Fi or mobile data and try again.",
        canRetake: false,
      };
    case "invalid_response":
      return {
        title: "Couldn't read the result",
        body: "Something went wrong while reading this label. Take the photo again.",
        canRetake: true,
      };
    default: {
      // If a new kind is added to DecodeResult, this line fails to compile until it is handled.
      const unreachable: never = result;
      return unreachable;
    }
  }
}
