import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

function mainText(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i);
  if (!m) return "";
  let s = m[0].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

test("homepage exposes an <h1>, <h2> structure, and 500+ chars inside <main>", () => {
  const html = read("index.html");
  const main = html.match(/<main[\s\S]*?<\/main>/i)[0];
  assert.ok(/<h1[\s>]/i.test(main), "expected an <h1> inside <main>");
  assert.ok((main.match(/<h2[\s>]/gi) || []).length >= 2, "expected a nested heading structure (2+ <h2>)");
  assert.ok(mainText(html).length >= 500, "expected 500+ chars of main text");
  // header brand demoted so the page keeps a single <h1>
  assert.equal((html.match(/<h1[\s>]/gi) || []).length, 1, "expected exactly one <h1>");
  assert.ok(html.includes('class="brand-title"'), "expected demoted header brand");
});

test("developer portal exists, names the product, and links every resource", () => {
  const html = read("developers.html");
  assert.match(html, /<title>[^<]*Roman Slack[^<]*<\/title>/);
  assert.ok(/<h1[\s>]/i.test(html));
  for (const href of ["/openapi.json", "/mcp", "/mcp/server-card", "/auth.md", "/llms.txt", "/llms-full.txt", "/sitemap.xml"]) {
    assert.ok(html.includes(`href="${href}"`), `developers.html should link ${href}`);
  }
});

test("llms.txt advertises the developer resources", () => {
  const txt = read("llms.txt");
  assert.ok(txt.includes("## Developer resources"));
  for (const url of ["/developers", "/openapi.json", "/mcp", "/auth.md"]) {
    assert.ok(txt.includes(url), `llms.txt should mention ${url}`);
  }
});

test("index.md (homepage markdown twin) lists the developer portal", () => {
  assert.ok(read("index.md").includes("https://romanslack.com/developers"));
});

test("sitemap includes the developer portal", () => {
  assert.ok(read("sitemap.xml").includes("https://romanslack.com/developers"));
});

test("vercel.json wires the /developers rewrite and the trailing catch-all last", () => {
  const cfg = JSON.parse(read("vercel.json"));
  const rw = cfg.rewrites;
  assert.ok(rw.some((r) => r.source === "/developers" && r.destination === "/developers.html"));
  const last = rw[rw.length - 1];
  assert.equal(last.source, "/(.*)");
  assert.equal(last.destination, "/api/not-found");
  // the Link header now advertises the developer portal
  const linkHeader = JSON.stringify(cfg.headers);
  assert.ok(linkHeader.includes("/developers"));
});

test("machine-readable JSON files stay valid", () => {
  const openapi = JSON.parse(read("openapi.json"));
  assert.equal(openapi.openapi, "3.1.0");
  assert.ok(openapi.paths["/projects.json"]);
  JSON.parse(read(".well-known/mcp/server-card.json"));
  JSON.parse(read(".well-known/ai-catalog.json"));
  JSON.parse(read(".well-known/agent-skills/index.json"));
});

test("OpenAPI documents a typed error model on every operation", () => {
  const openapi = JSON.parse(read("openapi.json"));
  const err = openapi.components.schemas.Error;
  assert.ok(err, "expected components.schemas.Error");
  assert.deepEqual(err.required, ["error"]);
  const props = err.properties.error.properties;
  for (const k of ["code", "status", "message"]) assert.ok(props[k], `Error.error.${k}`);
  assert.ok(openapi.components.responses.Error, "expected components.responses.Error");
  for (const p of Object.keys(openapi.paths)) {
    const op = openapi.paths[p].get;
    assert.ok(op.responses.default, `operation ${p} should declare a default error response`);
    assert.equal(op.responses.default.$ref, "#/components/responses/Error");
  }
});

test("OpenAPI declares a versioning policy", () => {
  const openapi = JSON.parse(read("openapi.json"));
  assert.ok(openapi.servers.some((s) => s.url.endsWith("/v1")), "expected a /v1 server");
  assert.match(openapi.info.description, /[Vv]ersion/);
  assert.match(openapi.info.description, /[Dd]eprecat/);
});

test("vercel.json aliases the /v1 base path", () => {
  const cfg = JSON.parse(read("vercel.json"));
  assert.ok(cfg.rewrites.some((r) => r.source === "/v1/projects.json" && r.destination === "/projects.json"));
});

test("developer portal documents the CLI, versioning, and the product name", () => {
  const html = read("developers.html");
  assert.ok(/<h1[^>]*>[^<]*Roman Slack[^<]*<\/h1>/.test(html), "h1 should carry the product name");
  assert.ok(html.includes("npx romanslack"), "should document the CLI");
  assert.ok(/Versioning/i.test(html), "should document versioning");
  assert.ok(html.includes("/v1/projects.json"), "should show the versioned path");
});

test("llms.txt advertises the CLI and the versioned base", () => {
  const txt = read("llms.txt");
  assert.ok(txt.includes("npx romanslack"), "llms.txt should mention the CLI");
  assert.ok(txt.includes("/v1/"), "llms.txt should mention the versioned base");
});

test("api-catalog is valid JSON and references the developer portal", () => {
  const cat = JSON.parse(read(".well-known/api-catalog"));
  assert.ok(Array.isArray(cat.linkset));
  assert.ok(JSON.stringify(cat).includes("https://romanslack.com/developers"));
});
