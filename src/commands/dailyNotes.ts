import { withErrorHandler } from "../lib/cli";
import { runRequest } from "../lib/http";
import { toArray } from "../lib/parsing";
import type { CommandContext } from "../lib/cli";
import type { QueryValue } from "../lib/types";

export function registerDailyNotes(context: CommandContext): void {
  const { cli, resolveOptions, handleError } = context;
  const action = <Args extends unknown[]>(handler: (...args: Args) => Promise<void>) =>
    withErrorHandler(handler, handleError);

  cli
    .command("search", "Search across daily notes")
    .option("--include <term>", "Include term (repeatable)")
    .option("--regex <pattern>", "Regex pattern (repeatable)")
    .option("--start-date <date>", "Start date (YYYY-MM-DD or relative)")
    .option("--end-date <date>", "End date (YYYY-MM-DD or relative)")
    .option("--fetch-metadata", "Include metadata")
    .option("--raw", "Print raw response")
    .action(
      action(async (options) => {
        const resolved = resolveOptions(options);
        const query: Record<string, QueryValue> = {};
        const include = toArray(options.include).map(String);
        const regexps = toArray(options.regex).map(String);

        if (include.length > 0) {
          query.include = include;
        }
        if (regexps.length > 0) {
          query.regexps = regexps;
        }
        if (options.startDate) {
          query.startDate = String(options.startDate);
        }
        if (options.endDate) {
          query.endDate = String(options.endDate);
        }
        if (options.fetchMetadata) {
          query.fetchMetadata = "true";
        }

        await runRequest(resolved, {
          method: "GET",
          path: "daily-notes/search",
          query,
          raw: options.raw,
        });
      }),
    );
}
