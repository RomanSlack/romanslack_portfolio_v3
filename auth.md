# auth.md

You are an agent. This site is a public portfolio. Almost everything here needs
no authentication: fetch it directly.

## What is open

- The website, `llms.txt`, `llms-full.txt`, and the JSON API (`projects.json`,
  `project_details.json`, `hobbies.json`, described by `openapi.json`) are public.
  Send a plain GET. Do not attempt to authenticate for these.

## The MCP server

There is a Model Context Protocol server at `https://romanslack.com/mcp`
(streamable HTTP). Its card is at `https://romanslack.com/mcp/server-card`.

Whether it requires auth depends on deployment:

- If a request to `/mcp` returns **200**, it is open. Use it directly.
- If it returns **401** with a `WWW-Authenticate: Bearer` challenge, follow the
  standard MCP authorization flow: discover -> register -> exchange -> use ->
  handle revocation.

## If challenged (401)

1. **Discover.** Read `resource_metadata` from the `WWW-Authenticate` header, or
   fetch `https://romanslack.com/.well-known/oauth-protected-resource`
   (RFC 9728). It names the authorization server in `authorization_servers` and
   the required scope `portfolio:read`.
2. **Read the AS metadata** at the authorization server's
   `/.well-known/oauth-authorization-server` (RFC 8414). It advertises
   `client_id_metadata_document_supported: true` (CIMD, preferred) and a
   `registration_endpoint` (RFC 7591 dynamic client registration, for older
   clients).
3. **Register / authorize** with PKCE (`S256`). Include
   `resource=https://romanslack.com/mcp` (RFC 8707) in both the authorization
   and token requests so the token is bound to this resource.
4. **Exchange** for an access token, then call `/mcp` with
   `Authorization: Bearer <token>`.
5. **Revocation.** On `invalid_token` or `invalid_grant`, re-run discovery and
   re-authorize.

## Contact

A human maintains this site. Questions: romanslack1@gmail.com
