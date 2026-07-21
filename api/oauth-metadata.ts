// Serves the OAuth/OIDC discovery documents for the portfolio MCP resource.
// Reachable via rewrites from:
//   /.well-known/oauth-protected-resource     (RFC 9728)
//   /.well-known/oauth-authorization-server   (RFC 8414 + auth.md agent_auth block)
//   /.well-known/openid-configuration         (alias of the above)
//
// All are driven by WORKOS_AUTHKIT_DOMAIN. If it is unset, every path returns
// 404: we never advertise an authorization server that does not exist.

const ORIGIN = "https://romanslack.com";
const RESOURCE = `${ORIGIN}/mcp`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600",
    },
  });

export function GET(req: Request) {
  const domain = process.env.WORKOS_AUTHKIT_DOMAIN;
  if (!domain) return json({ error: "authorization not configured" }, 404);

  // Accept either a bare host or a full URL, with or without a trailing slash.
  const host = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const issuer = `https://${host}`;
  const path = new URL(req.url).pathname;

  if (path.includes("oauth-protected-resource")) {
    return json({
      resource: RESOURCE,
      authorization_servers: [issuer],
      scopes_supported: ["portfolio:read"],
      bearer_methods_supported: ["header"],
      resource_name: "Roman Slack Portfolio MCP",
      resource_documentation: `${ORIGIN}/llms.txt`,
    });
  }

  // oauth-authorization-server and openid-configuration
  return json({
    issuer,
    authorization_endpoint: `${issuer}/oauth2/authorize`,
    token_endpoint: `${issuer}/oauth2/token`,
    registration_endpoint: `${issuer}/oauth2/register`,
    jwks_uri: `${issuer}/oauth2/jwks`,
    revocation_endpoint: `${issuer}/oauth2/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post", "none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["portfolio:read"],
    client_id_metadata_document_supported: true,
    // auth.md (WorkOS) profile: how an agent registers and claims an identity.
    agent_auth: {
      skill: `${ORIGIN}/auth.md`,
      identity_endpoint: `${issuer}/agent/identity`,
      claim_endpoint: `${issuer}/agent/identity/claim`,
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
