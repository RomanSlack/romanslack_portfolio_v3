// Catch-all handler for paths that match no static file and no earlier rewrite.
// Returns a real HTTP 404 with an agent-friendly body: structured JSON for API
// and JSON-preferring clients, markdown for markdown-preferring clients, and a
// styled HTML page for everyone else. Wired via the trailing "/(.*)" rewrite in
// vercel.json, which Vercel only applies to filesystem misses.
import { notFound } from "../lib/notfound.mjs";

function respond(req: Request): Response {
  const url = new URL(req.url);
  const accept = req.headers.get("accept") || "";
  const { status, contentType, body } = notFound(url.pathname, accept);
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "vary": "Accept",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export function GET(req: Request) {
  return respond(req);
}

export function POST(req: Request) {
  return respond(req);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}
