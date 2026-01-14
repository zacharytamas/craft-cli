import { describe, expect, test } from "bun:test";
import {
  normalizeAccept,
  parseJson,
  parseKeyValue,
  parseKeyValueList,
  parseNumber,
  requireConfirm,
} from "../src/lib/parsing";

describe("parsing", () => {
  test("parseNumber parses integers", () => {
    expect(parseNumber("12", "n")).toBe(12);
  });

  test("parseNumber throws on invalid", () => {
    expect(() => parseNumber("nope", "n")).toThrow("Invalid n value");
  });

  test("parseJson parses valid JSON", () => {
    expect(parseJson('{"a":1}', "payload")).toEqual({ a: 1 });
  });

  test("parseJson throws on invalid JSON", () => {
    expect(() => parseJson("{", "payload")).toThrow("Invalid payload JSON");
  });

  test("parseKeyValue parses key=value", () => {
    expect(parseKeyValue("a=b", "query")).toEqual(["a", "b"]);
  });

  test("parseKeyValueList parses repeated values", () => {
    expect(parseKeyValueList(["a=b", "c=d"], "query")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  test("parseKeyValue throws on missing equals", () => {
    expect(() => parseKeyValue("a", "query")).toThrow("query must be in key=value format");
  });

  test("parseKeyValue throws on empty key", () => {
    expect(() => parseKeyValue("=b", "query")).toThrow("query key is required");
  });

  test("normalizeAccept normalizes known values", () => {
    expect(normalizeAccept("markdown")).toBe("text/markdown");
    expect(normalizeAccept("text/markdown")).toBe("text/markdown");
    expect(normalizeAccept("json")).toBe("application/json");
    expect(normalizeAccept("application/json")).toBe("application/json");
  });

  test("normalizeAccept passes through unknown values", () => {
    expect(normalizeAccept("text/plain")).toBe("text/plain");
    expect(normalizeAccept(undefined)).toBeUndefined();
  });

  test("requireConfirm throws when false", () => {
    expect(() => requireConfirm(false, "blocks delete")).toThrow(
      "Refusing to run blocks delete",
    );
  });
});
