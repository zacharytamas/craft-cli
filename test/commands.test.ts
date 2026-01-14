import { afterEach, describe, expect, test } from "bun:test";
import { cac } from "cac";
import { registerBlocks } from "../src/commands/blocks";
import { registerCollections } from "../src/commands/collections";
import { registerDailyNotes } from "../src/commands/dailyNotes";
import { registerRequest } from "../src/commands/request";
import { registerTasks } from "../src/commands/tasks";
import type { CommandContext } from "../src/lib/cli";
import type { ResolvedOptions } from "../src/lib/types";

type FetchCall = {
  url: URL;
  method?: string;
  headers: Headers;
  body?: string | null;
};

const originalFetch = globalThis.fetch;
const originalLog = console.log;
const originalError = console.error;
const originalExitCode = process.exitCode;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.log = originalLog;
  console.error = originalError;
  process.exitCode = 0;
});

function createHarness(register: (context: CommandContext) => void) {
  const cli = cac("craft");
  const errors: string[] = [];
  const resolved: ResolvedOptions = {
    baseUrl: "https://example.com/api/v1",
    token: "token",
    timeoutMs: 5000,
  };

  const context: CommandContext = {
    cli,
    resolveOptions: () => resolved,
    handleError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      process.exitCode = 1;
    },
  };

  register(context);

  return { cli, errors };
}

async function runCommand(cli: ReturnType<typeof cac>, args: string[]) {
  cli.parse(["node", "craft", ...args], { run: false });
  await cli.runMatchedCommand();
}

function mockFetch() {
  const calls: FetchCall[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" ? init?.body : undefined;
    calls.push({ url, method: init?.method, headers, body });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  console.log = () => {};
  console.error = () => {};
  return calls;
}

describe("blocks commands", () => {
  test("get maps query and accept header", async () => {
    const { cli, errors } = createHarness(registerBlocks);
    const calls = mockFetch();

    await runCommand(cli, ["get", "--date", "today", "--accept", "markdown"]);

    expect(errors).toEqual([]);
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call.method).toBe("GET");
    expect(call.url.pathname).toBe("/api/v1/blocks");
    expect(call.url.searchParams.get("date")).toBe("today");
    expect(call.headers.get("Accept")).toBe("text/markdown");
  });

  test("search sets defaults and context params", async () => {
    const { cli, errors } = createHarness(registerBlocks);
    const calls = mockFetch();

    await runCommand(cli, ["search", "meeting", "--before", "1", "--after", "2"]);

    expect(errors).toEqual([]);
    const call = calls[0];
    expect(call.url.pathname).toBe("/api/v1/blocks/search");
    expect(call.url.searchParams.get("pattern")).toBe("meeting");
    expect(call.url.searchParams.get("date")).toBe("today");
    expect(call.url.searchParams.get("beforeBlockCount")).toBe("1");
    expect(call.url.searchParams.get("afterBlockCount")).toBe("2");
  });

  test("insert with markdown uses query position", async () => {
    const { cli, errors } = createHarness(registerBlocks);
    const calls = mockFetch();

    await runCommand(cli, [
      "insert",
      "--markdown",
      "# Daily Log",
      "--position",
      '{"position":"end","date":"today"}',
    ]);

    expect(errors).toEqual([]);
    const call = calls[0];
    expect(call.method).toBe("POST");
    expect(call.url.pathname).toBe("/api/v1/blocks");
    expect(call.url.searchParams.get("position")).toBe(
      '{"position":"end","date":"today"}',
    );
    expect(call.body).toBe("# Daily Log");
    expect(call.headers.get("content-type")).toBe("text/markdown");
  });

  test("delete requires confirmation", async () => {
    const { cli, errors } = createHarness(registerBlocks);
    const calls = mockFetch();

    await runCommand(cli, ["delete", "--ids", "1"]);

    expect(calls).toHaveLength(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("Refusing to run blocks delete");
  });
});

describe("daily-notes commands", () => {
  test("search passes repeatable params", async () => {
    const { cli, errors } = createHarness(registerDailyNotes);
    const calls = mockFetch();

    await runCommand(cli, [
      "search",
      "--include",
      "alpha",
      "--include",
      "beta",
      "--regex",
      "foo.*",
      "--start-date",
      "today",
    ]);

    expect(errors).toEqual([]);
    const call = calls[0];
    expect(call.url.pathname).toBe("/api/v1/daily-notes/search");
    expect(call.url.searchParams.getAll("include")).toEqual(["alpha", "beta"]);
    expect(call.url.searchParams.getAll("regexps")).toEqual(["foo.*"]);
    expect(call.url.searchParams.get("startDate")).toBe("today");
  });
});

describe("collections commands", () => {
  test("delete-items requires confirmation", async () => {
    const { cli, errors } = createHarness(registerCollections);
    const calls = mockFetch();

    await runCommand(cli, ["delete-items", "col1", "--ids", "a"]);

    expect(calls).toHaveLength(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("Refusing to run collections delete-items");
  });
});

describe("tasks commands", () => {
  test("list requires scope", async () => {
    const { cli, errors } = createHarness(registerTasks);
    const calls = mockFetch();

    await runCommand(cli, ["list"]);

    expect(calls).toHaveLength(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("--scope is required");
  });
});

describe("request command", () => {
  test("passes headers and query", async () => {
    const { cli, errors } = createHarness(registerRequest);
    const calls = mockFetch();

    await runCommand(cli, [
      "request",
      "GET",
      "blocks",
      "--query",
      "date=today",
      "--header",
      "X-Test=1",
    ]);

    expect(errors).toEqual([]);
    const call = calls[0];
    expect(call.url.pathname).toBe("/api/v1/blocks");
    expect(call.url.searchParams.get("date")).toBe("today");
    expect(call.headers.get("X-Test")).toBe("1");
  });
});
