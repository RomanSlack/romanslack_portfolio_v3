// Shared, framework-free core for the site's agent-friendly 404 response.
// Kept outside /api so Vercel does not turn it into its own function; it is
// imported by api/not-found.ts and exercised directly by the test suite.

const ORIGIN = "https://romanslack.com";

// Recovery links handed to any client that lands on a dead path.
export const RECOVERY_LINKS = [
  { title: "Developer portal", href: `${ORIGIN}/developers` },
  { title: "Sitemap", href: `${ORIGIN}/sitemap.xml` },
  { title: "Site overview for agents (llms.txt)", href: `${ORIGIN}/llms.txt` },
  { title: "Full content export (llms-full.txt)", href: `${ORIGIN}/llms-full.txt` },
  { title: "OpenAPI spec", href: `${ORIGIN}/openapi.json` },
  { title: "Portfolio MCP server", href: `${ORIGIN}/mcp` },
];

// Parse an Accept header into media types with their q-weights.
function acceptWeights(accept) {
  const weights = {};
  for (const part of (accept || "").split(",")) {
    const [type, ...params] = part.trim().split(";");
    if (!type) continue;
    let q = 1;
    for (const p of params) {
      const [k, v] = p.split("=").map((s) => s.trim());
      if (k === "q") q = parseFloat(v) || 0;
    }
    weights[type.trim().toLowerCase()] = q;
  }
  return weights;
}

// Decide which representation to return. API paths and JSON-preferring clients
// get structured JSON; markdown-preferring clients get a markdown body; anything
// else (browsers, unknown agents) gets HTML.
export function pickFormat(pathname, accept) {
  if (pathname.startsWith("/api/")) return "json";
  const w = acceptWeights(accept);
  const json = w["application/json"] ?? 0;
  const md = w["text/markdown"] ?? 0;
  const html = w["text/html"] ?? w["application/xhtml+xml"] ?? 0;
  const star = w["*/*"] ?? 0;
  if (json > 0 && json >= md && json >= html && json >= star) return "json";
  if (md > 0 && md >= html) return "markdown";
  return "html";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonBody(pathname) {
  return JSON.stringify(
    {
      error: {
        code: "not_found",
        status: 404,
        message: `No resource exists at ${pathname}.`,
        hint: "This path is not part of the site. Check the OpenAPI spec for valid endpoints or the developer portal for the full API surface.",
        documentation: `${ORIGIN}/developers`,
        openapi: `${ORIGIN}/openapi.json`,
        sitemap: `${ORIGIN}/sitemap.xml`,
        llms: `${ORIGIN}/llms.txt`,
      },
    },
    null,
    2,
  );
}

function markdownBody(pathname) {
  const links = RECOVERY_LINKS.map((l) => `- [${l.title}](${l.href})`).join("\n");
  return `# 404 Not Found

No resource exists at \`${pathname}\`.

## Where to look next

${links}

Home: ${ORIGIN}/
`;
}

function htmlBody(pathname) {
  const links = RECOVERY_LINKS.map(
    (l) => `                <li><a href="${l.href}">${escapeHtml(l.title)}</a></li>`,
  ).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 Not Found - Roman Slack</title>
    <meta name="robots" content="noindex, follow">
    <link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <header>
        <a href="/" class="back-arrow">&larr;</a>
        <h1>404</h1>
    </header>
    <main class="content-page">
        <p>No page exists at <code>${escapeHtml(pathname)}</code>. Here is where to look next:</p>
        <ul>
${links}
        </ul>
        <p><a href="/">Return to the Roman Slack homepage</a></p>
    </main>
</body>
</html>
`;
}

// Build the full 404 response payload for a given request path + Accept header.
export function notFound(pathname, accept) {
  const format = pickFormat(pathname, accept);
  if (format === "json") {
    return { status: 404, contentType: "application/json; charset=utf-8", body: jsonBody(pathname) };
  }
  if (format === "markdown") {
    return { status: 404, contentType: "text/markdown; charset=utf-8", body: markdownBody(pathname) };
  }
  return { status: 404, contentType: "text/html; charset=utf-8", body: htmlBody(pathname) };
}
