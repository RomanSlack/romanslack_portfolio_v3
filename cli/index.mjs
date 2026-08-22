#!/usr/bin/env node
// Official CLI for the Roman Slack portfolio API. Zero dependencies; talks to
// the read-only JSON endpoints on romanslack.com over plain HTTPS GET.
import {
  BASE,
  VERSION,
  USAGE,
  parseArgs,
  matchProject,
  renderProjects,
  renderProject,
  renderHobbies,
} from "./lib.mjs";

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} failed with HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));

  if (flags.version) return void console.log(VERSION);
  if (!command || flags.help) return void console.log(USAGE);

  switch (command) {
    case "projects": {
      const projects = await getJson("/projects.json");
      const out = flags.limit ? projects.slice(0, flags.limit) : projects;
      console.log(flags.json ? JSON.stringify(out, null, 2) : renderProjects(projects, flags.limit));
      break;
    }
    case "search": {
      const query = positionals[0];
      if (!query) {
        console.error("Usage: romanslack search <query>");
        process.exitCode = 1;
        return;
      }
      const projects = await getJson("/projects.json");
      let hits = projects.filter((p) => matchProject(p, query));
      if (flags.limit) hits = hits.slice(0, flags.limit);
      console.log(flags.json ? JSON.stringify(hits, null, 2) : renderProjects(hits));
      break;
    }
    case "project": {
      const id = parseInt(positionals[0], 10);
      if (Number.isNaN(id)) {
        console.error("Usage: romanslack project <id>");
        process.exitCode = 1;
        return;
      }
      const [projects, details] = await Promise.all([
        getJson("/projects.json"),
        getJson("/project_details.json"),
      ]);
      const base = projects.find((p) => p.id === id);
      if (!base) {
        console.error(`No project with id ${id}`);
        process.exitCode = 1;
        return;
      }
      const merged = { ...base, ...(details[String(id)] || {}) };
      console.log(flags.json ? JSON.stringify(merged, null, 2) : renderProject(merged));
      break;
    }
    case "hobbies": {
      const hobbies = await getJson("/hobbies.json");
      console.log(flags.json ? JSON.stringify(hobbies, null, 2) : renderHobbies(hobbies));
      break;
    }
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exitCode = 1;
});
