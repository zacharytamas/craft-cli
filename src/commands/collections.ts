import { Effect } from "effect";
import { withEffectHandler } from "../lib/cli";
import { parseNumber, requireConfirm } from "../lib/parsing";
import { CliHttpService } from "../lib/runtime";
import type { CommandContext } from "../lib/cli";

export function registerCollections(context: CommandContext): void {
  const { cli, resolveOptions, handleError } = context;
  const action = <Args extends unknown[]>(
    handler: (...args: Args) => Effect.Effect<void, unknown, CliHttpService>,
  ) => withEffectHandler(handler, handleError);

  cli
    .command("list", "List collections")
    .option("--start-date <date>", "Start date (YYYY-MM-DD or relative)")
    .option("--end-date <date>", "End date (YYYY-MM-DD or relative)")
    .option("--raw", "Print raw response")
    .action(
      action((options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const query: Record<string, string> = {};
        if (options.startDate) {
          query.startDate = String(options.startDate);
        }
        if (options.endDate) {
          query.endDate = String(options.endDate);
        }

        yield* CliHttpService.runRequest(resolved, {
          method: "GET",
          path: "collections",
          query,
          raw: options.raw,
        });
      }),
      ),
    );

  cli
    .command("schema <collectionId>", "Get collection schema")
    .option("--format <format>", "schema or json-schema-items")
    .option("--raw", "Print raw response")
    .action(
      action((collectionId, options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const query: Record<string, string> = {};
        if (options.format) {
          query.format = String(options.format);
        }

        yield* CliHttpService.runRequest(resolved, {
          method: "GET",
          path: `collections/${collectionId}/schema`,
          query,
          raw: options.raw,
        });
      }),
      ),
    );

  cli
    .command("items <collectionId>", "Get collection items")
    .option("--max-depth <n>", "Maximum depth")
    .option("--raw", "Print raw response")
    .action(
      action((collectionId, options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const query: Record<string, string> = {};
        if (options.maxDepth !== undefined) {
          query.maxDepth = String(parseNumber(options.maxDepth, "max-depth"));
        }

        yield* CliHttpService.runRequest(resolved, {
          method: "GET",
          path: `collections/${collectionId}/items`,
          query,
          raw: options.raw,
        });
      }),
      ),
    );

  cli
    .command("add-items <collectionId>", "Add collection items")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action((collectionId, options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const body = yield* CliHttpService.resolveBody(options.body, options.bodyFile, "application/json");

        yield* CliHttpService.runRequest(resolved, {
          method: "POST",
          path: `collections/${collectionId}/items`,
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
      ),
    );

  cli
    .command("update-items <collectionId>", "Update collection items")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action((collectionId, options) =>
        Effect.gen(function* () {
        const resolved = resolveOptions(options);
        const body = yield* CliHttpService.resolveBody(options.body, options.bodyFile, "application/json");

        yield* CliHttpService.runRequest(resolved, {
          method: "PUT",
          path: `collections/${collectionId}/items`,
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
      ),
    );

  cli
    .command("delete-items <collectionId>", "Delete collection items")
    .option("--ids <id>", "Item ID to delete (repeatable)")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--confirm", "Confirm deletion")
    .option("--raw", "Print raw response")
    .action(
      action((collectionId, options) =>
        Effect.gen(function* () {
        requireConfirm(options.confirm, "collections delete-items");
        const resolved = resolveOptions(options);
        const body = yield* CliHttpService.resolveDeleteBody(options, "idsToDelete");

        yield* CliHttpService.runRequest(resolved, {
          method: "DELETE",
          path: `collections/${collectionId}/items`,
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
      ),
    );
}
