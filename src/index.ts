#!/usr/bin/env bun
import { cac, type CAC } from "cac";
import pkg from "../package.json" with { type: "json" };
import { registerBlocks } from "./commands/blocks";
import { registerCollections } from "./commands/collections";
import { registerDailyNotes } from "./commands/dailyNotes";
import { registerRequest } from "./commands/request";
import { registerTasks } from "./commands/tasks";
import { createCommandContext } from "./lib/cli";

const CLI_NAME = typeof pkg.name === "string" ? pkg.name : "craft-cli";

const GROUPS: Record<string, (context: ReturnType<typeof createCommandContext>) => void> = {
  blocks: registerBlocks,
  "daily-notes": registerDailyNotes,
  collections: registerCollections,
  tasks: registerTasks,
};

const OPTIONS_WITH_VALUE = new Set(["--url", "--token"]);

const argv = process.argv;
const groupIndex = findGroupIndex(argv);
const groupName = groupIndex === -1 ? undefined : argv[groupIndex];

if (groupName && Object.hasOwn(GROUPS, groupName)) {
  const subcli = createSubcommandCli(groupName, GROUPS[groupName]);
  const subArgv = removeArgAt(argv, groupIndex);

  if (!hasCommandArg(subArgv)) {
    subcli.outputHelp();
  } else {
    subcli.parse(subArgv);
  }
} else {
  const cli = createMainCli();
  cli.parse(argv);
}

function createMainCli(): CAC {
  const cli = cac(CLI_NAME);
  registerGlobalOptions(cli);
  registerGroupPlaceholders(cli);

  const context = createCommandContext(cli);
  registerRequest(context);

  cli.on("command:*", () => {
    if (cli.args.length > 0) {
      console.error(`Unknown command: ${cli.args.join(" ")}`);
      process.exitCode = 1;
      cli.outputHelp();
    }
  });

  cli.version(pkg.version);
  cli.help();

  return cli;
}

function createSubcommandCli(
  group: string,
  register: (context: ReturnType<typeof createCommandContext>) => void,
): CAC {
  const cli = cac(`${CLI_NAME} ${group}`);
  registerGlobalOptions(cli);

  const context = createCommandContext(cli);
  register(context);

  cli.version(pkg.version);
  cli.help();

  return cli;
}

function registerGlobalOptions(cli: CAC): void {
  cli
    .option("--url <url>", "Craft API base URL (env: CRAFT_API_URL)")
    .option("--token <token>", "API token (env: CRAFT_API_TOKEN)")
    ;
}

function registerGroupPlaceholders(cli: CAC): void {
  cli.command("blocks", "Work with daily note blocks");
  cli.command("daily-notes", "Search across daily notes");
  cli.command("collections", "Manage collections");
  cli.command("tasks", "Manage tasks");
}

function findGroupIndex(args: string[]): number {
  for (let index = 2; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      return index + 1 < args.length ? index + 1 : -1;
    }
    if (arg.startsWith("-")) {
      if (OPTIONS_WITH_VALUE.has(arg)) {
        index += 1;
      }
      continue;
    }
    return index;
  }
  return -1;
}

function removeArgAt(args: string[], index: number): string[] {
  if (index < 0 || index >= args.length) {
    return [...args];
  }
  return [...args.slice(0, index), ...args.slice(index + 1)];
}

function hasCommandArg(args: string[]): boolean {
  for (let index = 2; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      return index + 1 < args.length;
    }
    if (arg.startsWith("-")) {
      if (OPTIONS_WITH_VALUE.has(arg)) {
        index += 1;
      }
      continue;
    }
    return true;
  }
  return false;
}
