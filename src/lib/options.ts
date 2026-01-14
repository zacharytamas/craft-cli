import type { GlobalOptions, ResolvedOptions } from "./types";

const DEFAULT_TIMEOUT_MS = 30_000;

export function resolveOptions(options: GlobalOptions): ResolvedOptions {
  const baseUrlRaw = options.url ?? process.env.CRAFT_API_URL;
  if (!baseUrlRaw) {
    throw new Error(
      "Missing API base URL. Provide --url or set CRAFT_API_URL (e.g. https://connect.craft.do/links/<share-id>/api/v1).",
    );
  }

  const token = options.token ?? process.env.CRAFT_API_TOKEN;
  const timeoutMs = DEFAULT_TIMEOUT_MS;

  return {
    baseUrl: normalizeBaseUrl(String(baseUrlRaw)),
    token: token ? String(token) : undefined,
    timeoutMs,
  };
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
