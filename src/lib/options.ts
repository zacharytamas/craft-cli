import { Effect } from "effect";
import { CliValidationError } from "./errors";
import type { GlobalOptions, ResolvedOptions } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

export function resolveOptions(options: GlobalOptions): ResolvedOptions {
  return Effect.runSync(resolveOptionsEffect(options));
}

export function resolveOptionsEffect(
  options: GlobalOptions,
): Effect.Effect<ResolvedOptions, CliValidationError, never> {
  const baseUrlRaw = options.url ?? process.env.CRAFT_API_URL;
  if (!baseUrlRaw) {
    return Effect.fail(
      new CliValidationError({
        message:
          "Missing API base URL. Provide --url or set CRAFT_API_URL (e.g. https://connect.craft.do/links/<share-id>/api/v1).",
      }),
    );
  }

  const token = options.token ?? process.env.CRAFT_API_TOKEN;
  const timeoutMs = DEFAULT_TIMEOUT_MS;

  return Effect.succeed({
    baseUrl: normalizeBaseUrl(String(baseUrlRaw)),
    token: token ? String(token) : undefined,
    timeoutMs,
  });
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
