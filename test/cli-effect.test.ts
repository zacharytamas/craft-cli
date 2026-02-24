import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { withEffectHandler } from "../src/lib/cli";

describe("withEffectHandler", () => {
  test("runs successful effects", async () => {
    let ran = false;
    const errors: string[] = [];

    const wrapped = withEffectHandler(
      () =>
        Effect.sync(() => {
          ran = true;
        }),
      (error) => {
        errors.push(String(error));
      },
    );

    await wrapped();

    expect(ran).toBe(true);
    expect(errors).toEqual([]);
  });

  test("routes failures to handleError", async () => {
    const errors: string[] = [];

    const wrapped = withEffectHandler(
      () => Effect.fail(new Error("boom")),
      (error) => {
        errors.push(error instanceof Error ? error.message : String(error));
      },
    );

    await wrapped();

    expect(errors).toEqual(["boom"]);
  });
});
