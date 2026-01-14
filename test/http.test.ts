import { describe, expect, test } from "bun:test";
import { resolveBody, resolveDeleteBody, runRequest } from "../src/lib/http";
import type { ResolvedOptions } from "../src/lib/types";

describe("http helpers", () => {
  test("resolveBody validates JSON", async () => {
    await expect(resolveBody("{", undefined, "application/json")).rejects.toThrow(
      "Request body must be valid JSON",
    );
  });

  test("resolveBody reads from file", async () => {
    const path = ".tmp-body.json";
    await Bun.write(path, '{"ok":true}');

    try {
      const body = await resolveBody(undefined, path, "application/json");
      expect(body).toBe('{"ok":true}');
    } finally {
      await Bun.file(path).delete();
    }
  });

  test("resolveDeleteBody builds body from ids", async () => {
    const body = await resolveDeleteBody({ ids: ["a", "b"] }, "blockIds");
    expect(JSON.parse(body)).toEqual({ blockIds: ["a", "b"] });
  });

  test("runRequest builds query params and auth headers", async () => {
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const originalExitCode = process.exitCode;
    const logs: string[] = [];
    const captured: {
      url?: string;
      headers?: Headers;
      method?: string;
    } = {};

    try {
      console.log = (message?: unknown) => {
        if (message !== undefined) {
          logs.push(String(message));
        }
      };

      globalThis.fetch = async (input, init) => {
        captured.url = String(input);
        captured.method = init?.method;
        captured.headers = new Headers(init?.headers);
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      };

      const options: ResolvedOptions = {
        baseUrl: "https://example.com/api/v1",
        token: "token",
        timeoutMs: 1000,
      };

      await runRequest(options, {
        method: "GET",
        path: "daily-notes/search",
        query: {
          include: ["alpha", "beta"],
          startDate: "today",
        },
      });

      expect(captured.method).toBe("GET");
      expect(captured.url).toBeDefined();

      const url = new URL(captured.url ?? "");
      expect(url.pathname).toBe("/api/v1/daily-notes/search");
      expect(url.searchParams.getAll("include")).toEqual(["alpha", "beta"]);
      expect(url.searchParams.get("startDate")).toBe("today");
      expect(captured.headers?.get("Authorization")).toBe("Bearer token");

      expect(logs.length).toBe(1);
      expect(JSON.parse(logs[0])).toEqual({ ok: true });
    } finally {
      globalThis.fetch = originalFetch;
      console.log = originalLog;
      process.exitCode = originalExitCode;
    }
  });
});
