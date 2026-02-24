import { describe, expect, test } from "bun:test";

describe("cli entrypoint routing", () => {
  test("treats __proto__ as unknown command", () => {
    const result = Bun.spawnSync({
      cmd: ["bun", "src/index.ts", "__proto__"],
      cwd: process.cwd(),
      stderr: "pipe",
      stdout: "pipe",
    });

    const stderr = result.stderr.toString("utf8");
    expect(result.exitCode).toBe(1);
    expect(stderr).toContain("Unknown command: __proto__");
    expect(stderr).not.toContain("TypeError");
  });

  test("subcommands read global options without crashing", () => {
    const result = Bun.spawnSync({
      cmd: ["bun", "src/index.ts", "tasks", "list", "--scope", "active"],
      cwd: process.cwd(),
      stderr: "pipe",
      stdout: "pipe",
      env: {
        ...process.env,
        CRAFT_API_URL: "",
        CRAFT_API_TOKEN: "",
      },
    });

    const stderr = result.stderr.toString("utf8");
    expect(result.exitCode).toBe(1);
    expect(stderr).toContain("Missing API base URL");
    expect(stderr).not.toContain("opts is not a function");
  });
});
