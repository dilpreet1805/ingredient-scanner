const MODEL = "claude-haiku-5-5";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return json({ error: "Service unavailable" }, 503);
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: "In one short sentence, what is peanut butter made from?",
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    console.error(
      "Claude request failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return json({ error: "Service unavailable" }, 503);
  }

  if (!upstream.ok) {
    console.error("Claude returned status", upstream.status);
    return json({ error: "Service unavailable" }, 502);
  }

  const data = await upstream.json();
  const textBlock = data.content?.find(
    (block: { type: string; text?: string }) => block.type === "text",
  );

  return json({
    reply: textBlock?.text ?? null,
    stopReason: data.stop_reason,
    usage: data.usage,
  });
});
