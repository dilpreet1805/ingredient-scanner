import { router, type Href } from "expo-router";

/**
 * Ends a flow and shows `href` as the only screen in the history, however many screens
 * are stacked up. Used when a flow is finished (profile created, data deleted), so that
 * Back can never return into the flow.
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
