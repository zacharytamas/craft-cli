import type { CAC } from "cac";
import { resolveOptions } from "./options";
import type { GlobalOptions, ResolvedOptions } from "./types";

export type CommandContext = {
  cli: CAC;
  resolveOptions: (options: Record<string, unknown>) => ResolvedOptions;
  handleError: (error: unknown) => void;
};

export function createCommandContext(cli: CAC): CommandContext {
  return {
    cli,
    resolveOptions(options) {
      const merged: GlobalOptions = {
        ...cli.opts<GlobalOptions>(),
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
  return async (...args: T) => {
    try {
      await handler(...args);
    } catch (error) {
      handleError(error);
    }
  };
}
