import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import { createChunkedStorage, type KeyValueBackend } from "./chunked-storage";
import { useSessionGate } from "./session-gate";
import {
    createSessionManager,
    SessionUnavailableError,
} from "./session-manager";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.example to .env, fill it in, and restart with: npx expo start -c",
  );
}

/** Public by design. Never add a secret key here. */
export const config = { url, publishableKey };

const secureOptions: SecureStore.SecureStoreOptions = {
  // Readable after the first unlock (so a background refresh works), and never copied to another device.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const secureBackend: KeyValueBackend = {
  get: (key) => SecureStore.getItemAsync(key, secureOptions),
  set: (key, value) => SecureStore.setItemAsync(key, value, secureOptions),
  remove: (key) => SecureStore.deleteItemAsync(key, secureOptions),
};

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: createChunkedStorage(secureBackend),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // there is no web address to read in an app
  },
});

// The library can't tell when the app goes to the background, so we tell it.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

const sessions = createSessionManager(
  {
    getSession: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error)
        throw new SessionUnavailableError("Could not read the saved session");
      return data.session;
    },
    signInAnonymously: async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.session)
        throw new SessionUnavailableError("Could not start a session");
      return data.session;
    },
  },
  () => useSessionGate.getState().allowed,
);

export const ensureSession = sessions.ensureSession;

/** Returns a fresh access token, or null if the session cannot be refreshed. */
export async function refreshAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.refreshSession();
  return error || !data.session ? null : data.session.access_token;
}
