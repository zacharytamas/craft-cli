# craft-cli

CLI for interacting with the Craft Daily Notes API.

## Setup

Install dependencies:

```bash
bun install
```

Configure environment variables:

```bash
# Craft API base URL (required)
export CRAFT_API_URL="https://connect.craft.do/links/9Qx7Lm2P0bZ/api/v1"

# API token (recommended; Bearer auth)
export CRAFT_API_TOKEN="your-token"
```

## Install as a binary

From this repo:

```bash
bun add -g .
```

Then run:

```bash
craft-cli --help
```

## Usage (dev)

Show help:

```bash
bun run src/index.ts --help
```

Fetch blocks (today by default):

```bash
bun run src/index.ts blocks get
```

Fetch blocks for a specific date:

```bash
bun run src/index.ts blocks get --date 2025-01-15
```

Fetch a specific block:

```bash
bun run src/index.ts blocks get --id <block-id>
```

Search a daily note:

```bash
bun run src/index.ts blocks search "meeting" --date today --before 1 --after 2
```

Search across daily notes:

```bash
bun run src/index.ts daily-notes search --include project --start-date 2025-01-01 --end-date today
```

Insert markdown (text/markdown mode, position as query param):

```bash
bun run src/index.ts blocks insert --markdown "# Daily Log" --position '{"position":"end","date":"today"}'
```

Insert blocks (JSON body):

```bash
bun run src/index.ts blocks insert --body '{"blocks":[{"type":"text","markdown":"Hello"}],"position":{"position":"end","date":"today"}}'
```

Update blocks:

```bash
bun run src/index.ts blocks update --body '{"blocks":[{"id":"5","markdown":"Updated"}]}'
```

Delete blocks (requires --confirm):

```bash
bun run src/index.ts blocks delete --ids 7 --ids 9 --confirm
```

Move blocks:

```bash
bun run src/index.ts blocks move --ids 2 --ids 3 --position '{"position":"end","date":"today"}'
```

List collections:

```bash
bun run src/index.ts collections list --start-date 2025-01-01 --end-date today
```

Get collection schema:

```bash
bun run src/index.ts collections schema <collection-id> --format json-schema-items
```

Get collection items:

```bash
bun run src/index.ts collections items <collection-id> --max-depth 1
```

Add collection items:

```bash
bun run src/index.ts collections add-items <collection-id> --body '{"items":[{"title":"Daily Task"}]}'
```

Update collection items:

```bash
bun run src/index.ts collections update-items <collection-id> --body '{"itemsToUpdate":[{"id":"item1","properties":{"status":"Done"}}]}'
```

Delete collection items (requires --confirm):

```bash
bun run src/index.ts collections delete-items <collection-id> --ids item1 --confirm
```

List tasks by scope:

```bash
bun run src/index.ts tasks list --scope active
```

Add tasks:

```bash
bun run src/index.ts tasks add --body '{"tasks":[{"markdown":"Prepare slides","location":{"type":"inbox"}}]}'
```

Update tasks:

```bash
bun run src/index.ts tasks update --body '{"tasksToUpdate":[{"id":"1","taskInfo":{"state":"done"}}]}'
```

Delete tasks (requires --confirm):

```bash
bun run src/index.ts tasks delete --ids 1 --confirm
```

Raw request:

```bash
bun run src/index.ts request GET blocks --query date=today
```

## Formatting

```bash
bun run format
bun run lint
bun run check
```
