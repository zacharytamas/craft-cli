import type { CAC } from "cac";
import { Effect } from "effect";
import { resolveOptions } from "./options";
import type { GlobalOptions, ResolvedOptions } from "./types";

export type CommandContext = {
  cli: CAC;
  resolveOptions: (options: Record<string, unknown>) => ResolvedOptions;
  handleError: (error: unknown) => void;
};

export function createCommandContext(cli: CAC): CommandContext {
  const cliWithOptions = cli as CAC & {
    opts: <T>() => T;
  };

  return {
    cli,
    resolveOptions(options) {
      const merged: GlobalOptions = {
        ...cliWithOptions.opts<GlobalOptions>(),
        ...options,
      };
      return resolveOptions(merged);
    },
    handleError(error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    },
  };
}

export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<void>,
  handleError: (error: unknown) => void,
): (...args: T) => Promise<void> {
  return withEffectHandler(
    (...args) =>
      Effect.tryPromise({
        try: () => handler(...args),
        catch: (error) => error,
      }),
    handleError,
  );
}

export function withEffectHandler<T extends unknown[]>(
  handler: (...args: T) => Effect.Effect<void, unknown, never>,
  handleError: (error: unknown) => void,
): (...args: T) => Promise<void> {
  return async (...args: T) => {
    await Effect.runPromise(
      handler(...args).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            handleError(error);
          }),
        ),
      ),
    );
  };
}
