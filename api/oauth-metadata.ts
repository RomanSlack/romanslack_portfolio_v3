// Serves the OAuth/OIDC discovery documents for the portfolio MCP resource.
// Reachable via rewrites from:
//   /.well-known/oauth-protected-resource     (RFC 9728)
//   /.well-known/oauth-authorization-server   (RFC 8414 + auth.md agent_auth block)
//   /.well-known/openid-configuration         (alias of the above)
//
// All are driven by WORKOS_AUTHKIT_DOMAIN. If it is unset, every path returns
// 404: we never advertise an authorization server that does not exist.

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=60",
    },
  });

export async function GET(req: Request) {
  const domain = process.env.WORKOS_AUTHKIT_DOMAIN;
  if (!domain) return json({ error: "authorization not configured" }, 404);

  // Accept either a bare host or a full URL, with or without a trailing slash.
  const host = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const issuer = `https://${host}`;
  const url = new URL(req.url);
  const path = url.pathname;
  // Bind the resource to the origin actually being served (apex or www) so the
  // resource identifier always matches the requesting host.
  const origin = url.origin;

  if (path.includes("oauth-protected-resource")) {
    return json({
      resource: `${origin}/mcp`,
      authorization_servers: [issuer],
      scopes_supported: ["portfolio:read"],
      bearer_methods_supported: ["header"],
      resource_name: "Roman Slack Portfolio MCP",
      resource_documentation: `${origin}/llms.txt`,
    });
  }

  // Authorization Server metadata (also aliased at openid-configuration).
  // Proxy WorkOS's real document so we never advertise more than the tenant
  // actually supports (no registration_endpoint or CIMD unless WorkOS truly
  // serves them). We add only the resource scope and the auth.md pointer.
  let base: Record<string, unknown> = {
    issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    jwks_uri: `${issuer}/oauth2/jwks`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
  };
  try {
    const upstream = await fetch(`${issuer}/.well-known/oauth-authorization-server`, {
      headers: { accept: "application/json" },
    });
    if (upstream.ok) base = (await upstream.json()) as Record<string, unknown>;
  } catch {
    // fall back to the minimal base above
  }

  // Prefer WorkOS's real registration endpoint if it advertises one.
  const registration = (base.registration_endpoint as string) || `${issuer}/oauth2/register`;

  return json({
    ...base,
    scopes_supported: ["portfolio:read"],
    // auth.md (WorkOS) profile: points agents at the registration runbook.
    agent_auth: {
      skill: `${origin}/auth.md`,
      register_uri: registration,
      identity_endpoint: `${issuer}/agent/identity`,
      claim_endpoint: `${issuer}/agent/identity/claim`,
      revocation_endpoint: (base.revocation_endpoint as string) || `${issuer}/oauth2/revoke`,
      identity_types_supported: ["anonymous", "identity_assertion", "service_auth"],
      identity_assertion: {
        assertion_types_supported: ["urn:ietf:params:oauth:token-type:id-jag"],
      },
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}
