import { Effect } from "effect";
import { withEffectHandler } from "../lib/cli";
import { resolveBodyEffect, runRequestEffect } from "../lib/http";
import { parseKeyValueList, toArray } from "../lib/parsing";
import type { CommandContext } from "../lib/cli";

export function registerRequest(context: CommandContext): void {
  const { cli, resolveOptions, handleError } = context;
  const action = <Args extends unknown[]>(
    handler: (...args: Args) => Effect.Effect<void, unknown, never>,
  ) => withEffectHandler(handler, handleError);

  cli
    .command("request <method> <path>", "Call an arbitrary API path")
    .option("--query <key=value>", "Add query param (repeatable)")
    .option("--header <key=value>", "Add header (repeatable)")
    .option("--data <json>", "JSON body as a string")
    .option("--data-file <path>", "Read request body from file")
    .option("--content-type <type>", "Override Content-Type")
    .option("--raw", "Print raw response")
    .action(
      action((method, path, options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const queryEntries = parseKeyValueList(toArray(options.query), "query");
        const headerEntries = parseKeyValueList(toArray(options.header), "header");

        const query = Object.fromEntries(queryEntries);
        const headers = Object.fromEntries(headerEntries);

        if (options.data && options.dataFile) {
          throw new Error("Use either --data or --data-file, not both.");
        }

        const contentType = options.contentType ? String(options.contentType) : undefined;
        const body =
          options.data === undefined && options.dataFile === undefined
            ? undefined
            : yield* resolveBodyEffect(options.data, options.dataFile, contentType);

        yield* runRequestEffect(resolved, {
          method: String(method),
          path: String(path),
          query,
          headers,
          body,
          raw: options.raw,
          contentType,
        });
      }),
      ),
    );
}
