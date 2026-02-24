import { readFile } from "node:fs/promises";
import { Effect } from "effect";
import { CliIoError, CliRequestError, CliValidationError } from "./errors";
import { toArray } from "./parsing";
import type { QueryValue, RequestConfig, ResolvedOptions } from "./types";

export async function runRequest(
  options: ResolvedOptions,
  request: RequestConfig,
): Promise<void> {
  await Effect.runPromise(runRequestEffect(options, request));
}

export function runRequestEffect(
  options: ResolvedOptions,
  request: RequestConfig,
): Effect.Effect<void, CliRequestError, never> {
  return Effect.tryPromise({
    try: async () => {
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
    },
    catch: (error) =>
      new CliRequestError({
        message: error instanceof Error ? error.message : String(error),
      }),
  });
}

export async function resolveBody(
  data: unknown,
  dataFile: unknown,
  contentType?: string,
): Promise<string> {
  return Effect.runPromise(resolveBodyEffect(data, dataFile, contentType));
}

export function resolveBodyEffect(
  data: unknown,
  dataFile: unknown,
  contentType?: string,
): Effect.Effect<string, CliValidationError | CliIoError, never> {
  return Effect.gen(function* () {
  if (data === undefined && dataFile === undefined) {
    return yield* Effect.fail(
      new CliValidationError({
        message: "Request body is required.",
      }),
    );
  }

  const bodyText =
    data === "-"
      ? yield* readStdinTextEffect()
      : data !== undefined
        ? String(data)
        : yield* readFileTextEffect(String(dataFile));
  const expectsJson = (contentType ?? "application/json").includes("json");

  if (expectsJson) {
    try {
      JSON.parse(bodyText);
    } catch (error) {
      return yield* Effect.fail(
        new CliValidationError({
          message: "Request body must be valid JSON when using application/json.",
        }),
      );
    }
  }

  return yield* Effect.succeed(bodyText);
  });
}

export async function resolveDeleteBody(
  options: Record<string, unknown>,
  key: string,
): Promise<string> {
  return Effect.runPromise(resolveDeleteBodyEffect(options, key));
}

export function resolveDeleteBodyEffect(
  options: Record<string, unknown>,
  key: string,
): Effect.Effect<string, CliValidationError | CliIoError, never> {
  return Effect.gen(function* () {
  if (options.body || options.bodyFile) {
    return yield* resolveBodyEffect(options.body, options.bodyFile, "application/json");
  }

  const ids = toArray(options.ids as string | string[] | undefined).map(String);
  if (ids.length === 0) {
    return yield* Effect.fail(
      new CliValidationError({
        message: "Provide --ids or --body/--body-file.",
      }),
    );
  }

  return yield* Effect.succeed(JSON.stringify({ [key]: ids }));
  });
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

function readFileTextEffect(path: string): Effect.Effect<string, CliIoError, never> {
  return Effect.tryPromise({
    try: () => readFile(path, "utf8"),
    catch: () =>
      new CliIoError({
        message: `Unable to read file: ${path}`,
      }),
  });
}

function readStdinTextEffect(): Effect.Effect<string, CliIoError, never> {
  return Effect.tryPromise({
    try: async () => {
    const chunks: Uint8Array[] = [];
    for await (const chunk of process.stdin) {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(chunk);
      }
    }
    return Buffer.concat(chunks).toString("utf8");
    },
    catch: () =>
      new CliIoError({
        message: "Unable to read from stdin.",
      }),
  });
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
