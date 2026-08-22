# romanslack

Official CLI for the [Roman Slack portfolio API](https://romanslack.com/developers). It reads the public, read-only JSON endpoints on romanslack.com, so no API key or sign-up is required.

## Install

Run it without installing:

```bash
npx romanslack projects
```

Or install globally:

```bash
npm install -g romanslack
```

## Usage

```bash
romanslack projects [--limit N] [--json]        # List projects, most prominent first
romanslack search <query> [--limit N] [--json]  # Search projects by keyword
romanslack project <id> [--json]                # Show one project in detail
romanslack hobbies [--json]                      # List hobbies
romanslack --help
romanslack --version
```

### Examples

```bash
romanslack projects --limit 5
romanslack search "reinforcement learning"
romanslack project 1 --json
```

## Configuration

Set `ROMANSLACK_API_BASE` to point the CLI at a different origin (defaults to `https://romanslack.com`).

## Related

- Developer portal: https://romanslack.com/developers
- OpenAPI spec: https://romanslack.com/openapi.json
- MCP server: https://romanslack.com/mcp

## License

MIT
