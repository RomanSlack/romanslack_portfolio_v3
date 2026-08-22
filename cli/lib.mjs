// Pure, network-free core for the romanslack CLI. Kept separate from the
// executable so it can be unit tested without hitting the live API.

export const VERSION = "1.0.0";
export const BASE = process.env.ROMANSLACK_API_BASE || "https://romanslack.com";

export const USAGE = `romanslack - CLI for the Roman Slack portfolio API (${BASE})

Usage:
  romanslack projects [--limit N] [--json]          List projects, most prominent first
  romanslack search <query> [--limit N] [--json]    Search projects by keyword
  romanslack project <id> [--json]                  Show one project in detail
  romanslack hobbies [--json]                        List hobbies
  romanslack --help | --version

Options:
  --limit N    Maximum number of results
  --json       Print raw JSON instead of formatted text

Docs: ${BASE}/developers`;

export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") flags.json = true;
    else if (a === "--help" || a === "-h") flags.help = true;
    else if (a === "--version" || a === "-v") flags.version = true;
    else if (a === "--limit") flags.limit = parseInt(argv[++i], 10);
    else if (a.startsWith("--limit=")) flags.limit = parseInt(a.slice("--limit=".length), 10);
    else positionals.push(a);
  }
  const [command, ...rest] = positionals;
  return { command, positionals: rest, flags };
}

export function matchProject(p, q) {
  q = String(q).toLowerCase();
  return [p.title, p.description, p.category].some(
    (f) => typeof f === "string" && f.toLowerCase().includes(q),
  );
}

export function renderProjects(projects, limit) {
  const list = limit ? projects.slice(0, limit) : projects;
  if (!list.length) return "No matching projects.";
  return list
    .map((p) => {
      const head = `#${p.id}  ${p.title}  (${p.date}, ${p.hours}h, ${p.category})`;
      const link = p.link ? `\n    ${p.link}` : "";
      return `${head}\n    ${p.description}${link}`;
    })
    .join("\n\n");
}

export function renderProject(p) {
  const lines = [
    `#${p.id}  ${p.title}`,
    `Date: ${p.date}   Hours: ${p.hours}   Category: ${p.category}`,
  ];
  if (p.link) lines.push(`Link: ${p.link}`);
  lines.push("", p.longDescription || p.description || "");
  if (p.techStack && p.techStack.length) lines.push("", "Tech: " + p.techStack.join(", "));
  if (p.features && p.features.length) lines.push("", "Features:", ...p.features.map((f) => "  - " + f));
  if (p.tags && p.tags.length) lines.push("", "Tags: " + p.tags.join(", "));
  return lines.join("\n");
}

export function renderHobbies(hobbies) {
  return hobbies
    .filter((h) => h.type === "text")
    .map((h) => "- " + h.content)
    .join("\n");
}
