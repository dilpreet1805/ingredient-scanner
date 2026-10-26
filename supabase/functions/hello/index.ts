// Supabase Edge Functions run on Deno, a TypeScript runtime with web-standard APIs.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request): Promise<Response> => {
  // Accept only the method we expect.
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Never assume the body is valid. Parse inside try/catch.
  let name = "there";
  try {
    const body = await req.json();
    if (typeof body?.name === "string") {
      name = body.name.slice(0, 40); // cap the length of anything we echo back
    }
  } catch {
    return json({ error: "Body must be valid JSON" }, 400);
  }

  return json({ message: `Hello, ${name}!` });
});
