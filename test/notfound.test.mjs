import { test } from "node:test";
import assert from "node:assert/strict";
import { notFound, pickFormat, RECOVERY_LINKS } from "../lib/notfound.mjs";

test("API paths always return structured JSON errors", () => {
  const res = notFound("/api/does-not-exist", "text/html");
  assert.equal(res.status, 404);
  assert.match(res.contentType, /application\/json/);
  const body = JSON.parse(res.body);
  assert.equal(body.error.code, "not_found");
  assert.equal(body.error.status, 404);
  assert.ok(body.error.message.includes("/api/does-not-exist"));
  assert.ok(body.error.hint.length > 0);
  assert.equal(body.error.openapi, "https://romanslack.com/openapi.json");
  assert.equal(body.error.sitemap, "https://romanslack.com/sitemap.xml");
  assert.equal(body.error.llms, "https://romanslack.com/llms.txt");
});

test("JSON-preferring clients get a JSON error even off /api", () => {
  const res = notFound("/nope", "application/json");
  assert.equal(res.status, 404);
  assert.match(res.contentType, /application\/json/);
  const body = JSON.parse(res.body);
  assert.equal(body.error.code, "not_found");
});

test("markdown-preferring clients get a markdown body with recovery links", () => {
  const res = notFound("/nope", "text/markdown");
  assert.equal(res.status, 404);
  assert.match(res.contentType, /text\/markdown/);
  assert.match(res.body, /^# 404 Not Found/m);
  assert.ok(res.body.includes("/sitemap.xml"));
  assert.ok(res.body.includes("/llms.txt"));
  assert.ok(res.body.includes("/developers"));
});

test("browsers get an HTML 404 page with links and escaped path", () => {
  const res = notFound("/<script>", "text/html,application/xhtml+xml");
  assert.equal(res.status, 404);
  assert.match(res.contentType, /text\/html/);
  assert.ok(res.body.includes("<h1>404</h1>"));
  assert.ok(res.body.includes("/sitemap.xml"));
  // path must be HTML-escaped, not reflected raw
  assert.ok(!res.body.includes("/<script>"));
  assert.ok(res.body.includes("&lt;script&gt;"));
});

test("unknown / empty Accept defaults to HTML", () => {
  assert.equal(pickFormat("/x", ""), "html");
  assert.equal(pickFormat("/x", "*/*"), "html");
});

test("format negotiation honours q-values", () => {
  assert.equal(pickFormat("/x", "text/html;q=0.9, text/markdown;q=1.0"), "markdown");
  assert.equal(pickFormat("/x", "text/markdown;q=0.5, text/html;q=1.0"), "html");
  assert.equal(pickFormat("/api/x", "text/html"), "json");
});

test("every recovery link is an absolute https URL", () => {
  for (const l of RECOVERY_LINKS) {
    assert.match(l.href, /^https:\/\/romanslack\.com\//);
  }
});
