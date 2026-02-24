import { Effect, Layer } from "effect";
import {
  resolveBodyEffect,
  resolveDeleteBodyEffect,
  runRequestEffect,
} from "./http";
import { resolveOptionsEffect } from "./options";
import type { GlobalOptions, RequestConfig, ResolvedOptions } from "./types";

export class CliOptionsService extends Effect.Service<CliOptionsService>()("CliOptionsService", {
  accessors: true,
  effect: Effect.succeed({
    resolve: Effect.fn("CliOptionsService.resolve")((options: GlobalOptions) =>
      resolveOptionsEffect(options),
    ),
  }),
}) {}

export class CliHttpService extends Effect.Service<CliHttpService>()("CliHttpService", {
  accessors: true,
  effect: Effect.succeed({
    runRequest: Effect.fn("CliHttpService.runRequest")(
      (options: ResolvedOptions, request: RequestConfig) => runRequestEffect(options, request),
    ),
    resolveBody: Effect.fn("CliHttpService.resolveBody")(
      (data: unknown, dataFile: unknown, contentType?: string) =>
        resolveBodyEffect(data, dataFile, contentType),
    ),
    resolveDeleteBody: Effect.fn("CliHttpService.resolveDeleteBody")(
      (options: Record<string, unknown>, key: string) => resolveDeleteBodyEffect(options, key),
    ),
  }),
}) {}

export const CliRuntimeLayer = Layer.mergeAll(CliOptionsService.Default, CliHttpService.Default);
