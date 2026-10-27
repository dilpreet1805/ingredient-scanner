import { useState } from "react";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionGate } from "@/lib/session-gate";
import { ensureSession } from "@/lib/supabase";
import { decodeLabel } from "./decode-client";

// TEMPORARY, removed in 6.6b. Checks the connection without spending anything:
// the server answers 400 to invalid image data before it counts or calls Claude.
export function DevSessionCheck() {
  const [text, setText] = useState("Not run yet");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      useSessionGate.getState().allow();
      const session = await ensureSession();
      const result = await decodeLabel({
        image: "!!!",
        mediaType: "image/jpeg",
      });
      setText(
        `user ${session.user.id.slice(0, 8)}...\nserver said: ${result.kind} (expected: rejected)`,
      );
    } catch (error) {
      setText(
        `failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-3">
      <AppText variant="title">Developer check</AppText>
      <AppText variant="caption">{text}</AppText>
      <Button
        title="Check connection"
        variant="soft"
        loading={busy}
        onPress={run}
      />
    </Card>
  );
}
