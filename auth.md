# auth.md

You are an AI agent. This document is a complete, standalone registration and
authorization flow for the Roman Slack Portfolio MCP server. Follow the steps in
order.

Most of this site is public and needs no authentication: the website, `llms.txt`,
`llms-full.txt`, and the JSON API (`projects.json`, `project_details.json`,
`hobbies.json`, described by `openapi.json`). Send a plain GET for those.

The MCP server at `https://romanslack.com/mcp` (streamable HTTP) is protected.
To call it, complete the OAuth 2.1 flow below.

## Step 1 — Discover

Fetch the Protected Resource Metadata (RFC 9728):

    GET https://romanslack.com/.well-known/oauth-protected-resource

It returns the resource identifier (`https://romanslack.com/mcp`), the required
scope (`portfolio:read`), and the `authorization_servers` list. Then fetch the
Authorization Server metadata (RFC 8414):

    GET https://romanslack.com/.well-known/oauth-authorization-server

Read `authorization_endpoint`, `token_endpoint`, `registration_endpoint`,
`jwks_uri`, and the `agent_auth` block.

## Step 2 — Register the client (RFC 7591 Dynamic Client Registration)

Register at the `registration_endpoint` (`agent_auth.register_uri`):

    POST <registration_endpoint>
    Content-Type: application/json

    {
      "client_name": "Your Agent Name",
      "redirect_uris": ["http://127.0.0.1:8976/callback"],
      "grant_types": ["authorization_code", "refresh_token"],
      "response_types": ["code"],
      "token_endpoint_auth_method": "none"
    }

The response returns a `client_id` (and `client_secret` if issued). Modern
clients may instead use a Client ID Metadata Document (CIMD) if the server
advertises `client_id_metadata_document_supported`.

## Step 3 — Authorize with PKCE

Generate a PKCE `code_verifier` and its `S256` `code_challenge`, then send the
user to the `authorization_endpoint`. Include `resource` (RFC 8707) so the token
is bound to this MCP server:

    GET <authorization_endpoint>
      ?response_type=code
      &client_id=<client_id>
      &redirect_uri=http://127.0.0.1:8976/callback
      &scope=portfolio:read
      &code_challenge=<code_challenge>
      &code_challenge_method=S256
      &resource=https://romanslack.com/mcp
      &state=<random>

The user signs in and is redirected back to your `redirect_uri` with a `code`.

## Step 4 — Exchange the code for an access token

    POST <token_endpoint>
    Content-Type: application/x-www-form-urlencoded

    grant_type=authorization_code
    &code=<code>
    &redirect_uri=http://127.0.0.1:8976/callback
    &client_id=<client_id>
    &code_verifier=<code_verifier>
    &resource=https://romanslack.com/mcp

The response contains `access_token`, `token_type` (`Bearer`), `expires_in`, and
usually a `refresh_token`.

## Step 5 — Call the MCP server

    POST https://romanslack.com/mcp
    Authorization: Bearer <access_token>
    Content-Type: application/json
    Accept: application/json, text/event-stream

    {"jsonrpc":"2.0","id":1,"method":"tools/list"}

Available tools: `list_projects`, `search_projects`, `get_project`,
`list_hobbies`. All are read-only.

## Step 6 — Refresh and revoke

When the access token expires, refresh it:

    POST <token_endpoint>
    Content-Type: application/x-www-form-urlencoded

    grant_type=refresh_token
    &refresh_token=<refresh_token>
    &client_id=<client_id>
    &resource=https://romanslack.com/mcp

To revoke, POST the token to the `revocation_endpoint` (RFC 7009). On a `401`
with `invalid_token`, restart at Step 1.

## Contact

A human maintains this site: romanslack1@gmail.com
