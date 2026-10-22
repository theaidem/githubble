export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pass the Go SSE stream through without buffering it. This gives browsers a
// same-origin URL in both Docker Compose and local development.
export async function GET(request: Request) {
  const backend = process.env.BACKEND_URL || "http://localhost:3003";
  try {
    const upstream = await fetch(`${backend}/sse`, {
      signal: request.signal,
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("Event service unavailable", { status: 502 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        // The stream is public; allow the GitHub Pages build to read it.
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Event service unavailable", { status: 502 });
  }
}
