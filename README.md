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

## Quick start

Fetch today’s daily note blocks:

```bash
craft-cli blocks get
```

Search today’s daily note:

```bash
craft-cli blocks search "meeting"
```

List active tasks:

```bash
craft-cli tasks list --scope active
```

## Usage

Show help:

```bash
craft-cli --help
```

### Blocks

Fetch blocks (today by default):

```bash
craft-cli blocks get
```

Fetch blocks for a specific date:

```bash
craft-cli blocks get --date 2025-01-15
```

Fetch a specific block:

```bash
craft-cli blocks get --id <block-id>
```

Search a daily note:

```bash
craft-cli blocks search "meeting" --date today --before 1 --after 2
```

Insert markdown (text/markdown mode, position as query param):

```bash
craft-cli blocks insert --markdown "# Daily Log" --position '{"position":"end","date":"today"}'
```

Insert blocks (JSON body):

```bash
craft-cli blocks insert --body '{"blocks":[{"type":"text","markdown":"Hello"}],"position":{"position":"end","date":"today"}}'
```

Update blocks:

```bash
craft-cli blocks update --body '{"blocks":[{"id":"5","markdown":"Updated"}]}'
```

Delete blocks (requires --confirm):

```bash
craft-cli blocks delete --ids 7 --ids 9 --confirm
```

Move blocks:

```bash
craft-cli blocks move --ids 2 --ids 3 --position '{"position":"end","date":"today"}'
```

### Daily notes

Search across daily notes:

```bash
craft-cli daily-notes search --include project --start-date 2025-01-01 --end-date today
```

### Collections

List collections:

```bash
craft-cli collections list --start-date 2025-01-01 --end-date today
```

Get collection schema:

```bash
craft-cli collections schema <collection-id> --format json-schema-items
```

Get collection items:

```bash
craft-cli collections items <collection-id> --max-depth 1
```

Add collection items:

```bash
craft-cli collections add-items <collection-id> --body '{"items":[{"title":"Daily Task"}]}'
```

Update collection items:

```bash
craft-cli collections update-items <collection-id> --body '{"itemsToUpdate":[{"id":"item1","properties":{"status":"Done"}}]}'
```

Delete collection items (requires --confirm):

```bash
craft-cli collections delete-items <collection-id> --ids item1 --confirm
```

### Tasks

List tasks by scope:

```bash
craft-cli tasks list --scope active
```

Add tasks:

```bash
craft-cli tasks add --body '{"tasks":[{"markdown":"Prepare slides","location":{"type":"inbox"}}]}'
```

Update tasks:

```bash
craft-cli tasks update --body '{"tasksToUpdate":[{"id":"1","taskInfo":{"state":"done"}}]}'
```

Delete tasks (requires --confirm):

```bash
craft-cli tasks delete --ids 1 --confirm
```

### Raw request

```bash
craft-cli request GET blocks --query date=today
```

## Formatting

```bash
bun run format
bun run lint
bun run check
```
