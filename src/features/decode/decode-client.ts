import { config, ensureSession, refreshAccessToken } from "@/lib/supabase";
import { createDecodeClient } from "./decode-api";

export const decodeLabel = createDecodeClient({
  endpoint: `${config.url}/functions/v1/decode-label`,
  publishableKey: config.publishableKey,
  getToken: async () => (await ensureSession()).access_token,
  refreshToken: refreshAccessToken,
});
