import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Canonical origin. Portfolio data is fetched from the live static JSON so the
// MCP server stays single-sourced with the site (no bundled copy to drift).
const ORIGIN = "https://romanslack.com";
const RESOURCE = `${ORIGIN}/mcp`;

async function getJson(path: string): Promise<any> {
  const res = await fetch(`${ORIGIN}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`fetch ${path} -> ${res.status}`);
  return res.json();
}

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_projects",
      "List Roman Slack's portfolio projects, ordered by prominence (lower id first).",
      { limit: z.number().int().min(1).max(100).optional() },
      async ({ limit }) => {
        const projects = await getJson("/projects.json");
        return text(
          projects.slice(0, limit ?? 25).map((p: any) => ({
            id: p.id, title: p.title, date: p.date, category: p.category,
            hours: p.hours, link: p.link ?? null, description: p.description,
          }))
        );
      }
    );

    server.tool(
      "search_projects",
      "Search Roman Slack's projects by keyword across title, description, and category.",
      { query: z.string(), limit: z.number().int().min(1).max(25).optional() },
      async ({ query, limit }) => {
        const projects = await getJson("/projects.json");
        const q = query.toLowerCase();
        const hits = projects
          .filter((p: any) =>
            [p.title, p.description, p.category].some(
              (f) => typeof f === "string" && f.toLowerCase().includes(q)
            )
          )
          .slice(0, limit ?? 10);
        return text({ count: hits.length, results: hits });
      }
    );

    server.tool(
      "get_project",
      "Get full detail (long description, features, tech stack, tags) for one project by numeric id.",
      { id: z.number().int() },
      async ({ id }) => {
        const [projects, details] = await Promise.all([
          getJson("/projects.json"),
          getJson("/project_details.json"),
        ]);
        const project = projects.find((p: any) => p.id === id);
        if (!project) return text({ error: `No project with id ${id}` });
        return text({ ...project, ...(details[String(id)] ?? {}) });
      }
    );

    server.tool(
      "list_hobbies",
      "List Roman Slack's hobbies.",
      {},
      async () => {
        const hobbies = await getJson("/hobbies.json");
        return text(hobbies.filter((h: any) => h.type === "text").map((h: any) => h.content));
      }
    );
  },
  {},
  { basePath: "/api", maxDuration: 60 }
);

// OAuth enforcement is opt-in via env. When WORKOS_AUTHKIT_DOMAIN is set, the
// /mcp endpoint requires a valid WorkOS-issued bearer token bound to this
// resource. When unset, the server is open (spec-legal for public data) and we
// advertise no auth (the oauth metadata endpoints also 404 in that case).
const authkitDomain = process.env.WORKOS_AUTHKIT_DOMAIN;

let exported = handler;

if (authkitDomain) {
  // Accept either a bare host or a full URL, with or without a trailing slash.
  const host = authkitDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const issuer = `https://${host}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/oauth2/jwks`));

  const verifyToken = async (_req: Request, bearer?: string) => {
    if (!bearer) return undefined;
    try {
      const { payload } = await jwtVerify(bearer, jwks, { issuer });
      // RFC 8707: the token audience must be bound to this resource.
      const aud = payload.aud;
      const audOk = Array.isArray(aud) ? aud.includes(RESOURCE) : aud === RESOURCE;
      if (!audOk) return undefined;
      const scope = typeof payload.scope === "string" ? payload.scope.split(" ") : [];
      return {
        token: bearer,
        clientId: String(payload.client_id ?? payload.azp ?? ""),
        scopes: scope,
        extra: { sub: payload.sub },
      };
    } catch {
      return undefined;
    }
  };

  exported = withMcpAuth(handler, verifyToken, {
    required: true,
    requiredScopes: ["portfolio:read"],
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
  });
}

export { exported as GET, exported as POST, exported as DELETE };
