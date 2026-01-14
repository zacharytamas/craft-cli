import { withErrorHandler } from "../lib/cli";
import { runRequest, resolveBody, resolveDeleteBody } from "../lib/http";
import {
  normalizeAccept,
  parseJson,
  parseNumber,
  requireConfirm,
  toArray,
} from "../lib/parsing";
import type { CommandContext } from "../lib/cli";
import type { QueryValue } from "../lib/types";

export function registerBlocks(context: CommandContext): void {
  const { cli, resolveOptions, handleError } = context;
  const action = <Args extends unknown[]>(handler: (...args: Args) => Promise<void>) =>
    withErrorHandler(handler, handleError);

  cli
    .command("get", "Fetch blocks from daily notes")
    .option("--date <date>", "Daily note date (today, tomorrow, yesterday, or YYYY-MM-DD)")
    .option("--id <id>", "Block ID to fetch")
    .option("--max-depth <n>", "Maximum depth")
    .option("--fetch-metadata", "Include metadata")
    .option("--accept <type>", "Response format: json or markdown (default: json)")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);

        if (options.date && options.id) {
          throw new Error("Use either --date or --id, not both.");
        }

        const query: Record<string, string> = {};
        if (options.date) {
          query.date = String(options.date);
        }
        if (options.id) {
          query.id = String(options.id);
        }
        if (options.maxDepth !== undefined) {
          query.maxDepth = String(parseNumber(options.maxDepth, "max-depth"));
        }
        if (options.fetchMetadata) {
          query.fetchMetadata = "true";
        }

        const acceptValue = normalizeAccept(options.accept);

        await runRequest(resolved, {
          method: "GET",
          path: "blocks",
          query,
          headers: acceptValue ? { Accept: acceptValue } : undefined,
          raw: options.raw,
        });
      }),
    );

  cli
    .command("insert", "Insert blocks or markdown into daily notes")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--markdown <text>", "Insert raw markdown (text/markdown)")
    .option("--position <json>", "Position object as JSON string")
    .option("--content-type <type>", "Override Content-Type")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        const hasBody = options.body !== undefined || options.bodyFile !== undefined;
        const hasMarkdown = options.markdown !== undefined;

        if (!hasBody && !hasMarkdown) {
          throw new Error("Provide --body/--body-file or --markdown.");
        }
        if (hasBody && hasMarkdown) {
          throw new Error("Use either --body/--body-file or --markdown, not both.");
        }

        const position = options.position ? parseJson(options.position, "position") : undefined;
        let query: Record<string, QueryValue> | undefined;
        let contentType = options.contentType as string | undefined;
        let body: string | undefined;

        if (hasBody) {
          contentType = contentType ?? "application/json";
          body = await resolveBody(options.body, options.bodyFile, contentType);
        } else if (hasMarkdown) {
          contentType = contentType ?? "text/markdown";
          if (contentType.includes("json")) {
            body = JSON.stringify({
              markdown: String(options.markdown),
              ...(position ? { position } : {}),
            });
          } else {
            body = String(options.markdown);
            if (position) {
              query = {
                position: JSON.stringify(position),
              };
            }
          }
        }

        await runRequest(resolved, {
          method: "POST",
          path: "blocks",
          query,
          body,
          contentType,
          raw: options.raw,
        });
      }),
    );

  cli
    .command("update", "Update blocks in daily notes")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        const body = await resolveBody(options.body, options.bodyFile, "application/json");
        await runRequest(resolved, {
          method: "PUT",
          path: "blocks",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );

  cli
    .command("delete", "Delete blocks from daily notes")
    .option("--ids <id>", "Block ID to delete (repeatable)")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--confirm", "Confirm deletion")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        requireConfirm(options.confirm, "blocks delete");
        const resolved = resolveOptions(options);
        const body = await resolveDeleteBody(options, "blockIds");
        await runRequest(resolved, {
          method: "DELETE",
          path: "blocks",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );

  cli
    .command("move", "Move blocks to a new position")
    .option("--ids <id>", "Block ID to move (repeatable)")
    .option("--position <json>", "Position object as JSON string")
    .option("--body <json>", "Request body as JSON string")
    .option("--body-file <path>", "Read request body from file")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        let body: string | undefined;

        if (options.body || options.bodyFile) {
          body = await resolveBody(options.body, options.bodyFile, "application/json");
        } else {
          const ids = toArray(options.ids).map(String);
          if (ids.length === 0) {
            throw new Error("Provide --ids or --body/--body-file.");
          }
          if (!options.position) {
            throw new Error("Provide --position when using --ids.");
          }
          const position = parseJson(options.position, "position");
          body = JSON.stringify({ blockIds: ids, position });
        }

        await runRequest(resolved, {
          method: "PUT",
          path: "blocks/move",
          body,
          contentType: "application/json",
          raw: options.raw,
        });
      }),
    );

  cli
    .command("search <pattern>", "Search a daily note")
    .option("--date <date>", "Daily note date (default: today)")
    .option("--case-sensitive", "Case-sensitive search")
    .option("--before <n>", "Blocks before the match")
    .option("--after <n>", "Blocks after the match")
    .option("--raw", "Print raw response")
    .action(
      action(async (pattern, options) => {
        const resolved = resolveOptions(options);
        const query: Record<string, string> = {
          pattern: String(pattern),
          date: String(options.date ?? "today"),
        };

        if (options.caseSensitive) {
          query.caseSensitive = "true";
        }
        if (options.before !== undefined) {
          query.beforeBlockCount = String(parseNumber(options.before, "before"));
        }
        if (options.after !== undefined) {
          query.afterBlockCount = String(parseNumber(options.after, "after"));
        }

        await runRequest(resolved, {
          method: "GET",
          path: "blocks/search",
          query,
          raw: options.raw,
        });
      }),
    );
}
