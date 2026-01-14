import { withErrorHandler } from "../lib/cli";
import { runRequest, resolveBody, resolveDeleteBody } from "../lib/http";
import { requireConfirm } from "../lib/parsing";
import type { CommandContext } from "../lib/cli";

export function registerTasks(context: CommandContext): void {
  const { cli, resolveOptions, handleError } = context;
  const action = <Args extends unknown[]>(handler: (...args: Args) => Promise<void>) =>
    withErrorHandler(handler, handleError);

  cli
    .command("list", "List tasks by scope")
    .option("--scope <scope>", "active, upcoming, inbox, or logbook")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        if (!options.scope) {
          throw new Error("--scope is required (active, upcoming, inbox, logbook).");
        }
        const query: Record<string, string> = {
          scope: String(options.scope),
        };

        await runRequest(resolved, {
          method: "GET",
          path: "tasks",
          query,
          raw: options.raw,
        });
      }),
    );

  cli
    .command("add", "Add tasks")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        const body = await resolveBody(options.body, options.bodyFile, "application/json");

        await runRequest(resolved, {
          method: "POST",
          path: "tasks",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );

  cli
    .command("update", "Update tasks")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        const body = await resolveBody(options.body, options.bodyFile, "application/json");

        await runRequest(resolved, {
          method: "PUT",
          path: "tasks",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );

  cli
    .command("delete", "Delete tasks")
    .option("--ids <id>", "Task ID to delete (repeatable)")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--confirm", "Confirm deletion")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        requireConfirm(options.confirm, "tasks delete");
        const resolved = resolveOptions(options);
        const body = await resolveDeleteBody(options, "idsToDelete");

        await runRequest(resolved, {
          method: "DELETE",
          path: "tasks",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );
}
