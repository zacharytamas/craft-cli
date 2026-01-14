import { afterEach, describe, expect, test } from "bun:test";
import { resolveOptions } from "../src/lib/options";

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe("resolveOptions", () => {
  test("uses env values by default", () => {
    process.env.CRAFT_API_URL = "https://env.example/api/v1";
    process.env.CRAFT_API_TOKEN = "env-token";

    const resolved = resolveOptions({});

    expect(resolved.baseUrl).toBe("https://env.example/api/v1");
    expect(resolved.token).toBe("env-token");
  });

  test("options override env values", () => {
    process.env.CRAFT_API_URL = "https://env.example/api/v1";
    process.env.CRAFT_API_TOKEN = "env-token";

    const resolved = resolveOptions({
      url: "https://opt.example/api/v1/",
      token: "opt-token",
    });

    expect(resolved.baseUrl).toBe("https://opt.example/api/v1");
    expect(resolved.token).toBe("opt-token");
  });

  test("throws when base URL is missing", () => {
    expect(() => resolveOptions({})).toThrow("Missing API base URL");
  });
});
