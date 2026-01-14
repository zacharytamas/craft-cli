import { toArray } from "./parsing";
import type { QueryValue, RequestConfig, ResolvedOptions } from "./types";

export async function runRequest(
  options: ResolvedOptions,
  request: RequestConfig,
): Promise<void> {
  const url = buildUrl(options.baseUrl, request.path, request.query);
  const headers = new Headers();

  if (request.headers) {
    for (const [key, value] of Object.entries(request.headers)) {
      headers.set(key, value);
    }
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (request.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", request.contentType ?? "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      method: request.method.toUpperCase(),
      headers,
      body: request.body,
      signal: controller.signal,
    });

    const text = await response.text();

    if (request.raw) {
      if (!response.ok) {
        process.exitCode = 1;
      }
      if (text.length > 0) {
        console.log(text);
      }
      return;
    }

    const json = safeJsonParse(text);

    if (!response.ok) {
      process.exitCode = 1;
      console.error(`${response.status} ${response.statusText}`);
      if (json !== undefined) {
        console.error(JSON.stringify(json, null, 2));
      } else if (text.length > 0) {
        console.error(text);
      }
      return;
    }

    if (json !== undefined) {
      console.log(JSON.stringify(json, null, 2));
    } else if (text.length > 0) {
      console.log(text);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveBody(
  data: unknown,
  dataFile: unknown,
  contentType?: string,
): Promise<string> {
  if (data === undefined && dataFile === undefined) {
    throw new Error("Request body is required.");
  }

  const bodyText = data !== undefined ? String(data) : await readFileText(String(dataFile));
  const expectsJson = (contentType ?? "application/json").includes("json");

  if (expectsJson) {
    try {
      JSON.parse(bodyText);
    } catch (error) {
      throw new Error("Request body must be valid JSON when using application/json.");
    }
  }

  return bodyText;
}

export async function resolveDeleteBody(
  options: Record<string, unknown>,
  key: string,
): Promise<string> {
  if (options.body || options.bodyFile) {
    return resolveBody(options.body, options.bodyFile, "application/json");
  }

  const ids = toArray(options.ids as string | string[] | undefined).map(String);
  if (ids.length === 0) {
    throw new Error("Provide --ids or --body/--body-file.");
  }

  return JSON.stringify({ [key]: ids });
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const target = path.startsWith("http://") || path.startsWith("https://");
  const url = target ? new URL(path) : new URL(path, `${baseUrl}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (entry !== undefined && entry !== "") {
            url.searchParams.append(key, entry);
          }
        }
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

async function readFileText(path: string): Promise<string> {
  try {
    return await Bun.file(path).text();
  } catch (error) {
    throw new Error(`Unable to read file: ${path}`);
  }
}

function safeJsonParse(value: string): unknown | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
