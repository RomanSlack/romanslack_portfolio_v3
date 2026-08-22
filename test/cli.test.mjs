import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseArgs,
  matchProject,
  renderProjects,
  renderProject,
  renderHobbies,
  USAGE,
  VERSION,
} from "../cli/lib.mjs";

const SAMPLE = [
  { id: 1, title: "Hlynr Intercept", description: "Missile-interception reinforcement learning", date: "01-2025", category: "programming", hours: 200, link: "https://example.com/h" },
  { id: 2, title: "SimuVerse", description: "Multi-agent LLM simulation on Mars", date: "02-2025", category: "programming", hours: 120 },
];

test("parseArgs splits command, positionals, and flags", () => {
  assert.deepEqual(parseArgs(["projects", "--limit", "5", "--json"]), {
    command: "projects",
    positionals: [],
    flags: { limit: 5, json: true },
  });
  assert.deepEqual(parseArgs(["search", "voice ai", "--limit=3"]), {
    command: "search",
    positionals: ["voice ai"],
    flags: { limit: 3 },
  });
  assert.deepEqual(parseArgs([]), { command: undefined, positionals: [], flags: {} });
  assert.equal(parseArgs(["--help"]).flags.help, true);
  assert.equal(parseArgs(["-v"]).flags.version, true);
});

test("matchProject matches title, description, and category, case-insensitively", () => {
  assert.equal(matchProject(SAMPLE[0], "MISSILE"), true);
  assert.equal(matchProject(SAMPLE[1], "mars"), true);
  assert.equal(matchProject(SAMPLE[0], "programming"), true);
  assert.equal(matchProject(SAMPLE[1], "nonexistent"), false);
});

test("renderProjects honours the limit and lists fields", () => {
  const out = renderProjects(SAMPLE, 1);
  assert.ok(out.includes("#1  Hlynr Intercept"));
  assert.ok(out.includes("https://example.com/h"));
  assert.ok(!out.includes("SimuVerse"), "limit should cap the list");
  assert.equal(renderProjects([], undefined), "No matching projects.");
});

test("renderProject includes detail fields when present", () => {
  const out = renderProject({ ...SAMPLE[0], longDescription: "Long", techStack: ["Unity", "Rust"], features: ["radar"], tags: ["RL"] });
  assert.ok(out.includes("#1  Hlynr Intercept"));
  assert.ok(out.includes("Tech: Unity, Rust"));
  assert.ok(out.includes("- radar"));
  assert.ok(out.includes("Tags: RL"));
});

test("renderHobbies lists only text entries", () => {
  const out = renderHobbies([
    { type: "text", content: "Mountaineering" },
    { type: "image", content: "x.png" },
    { type: "text", content: "Trail running" },
  ]);
  assert.equal(out, "- Mountaineering\n- Trail running");
});

test("USAGE and VERSION are exported", () => {
  assert.match(USAGE, /romanslack/);
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});
