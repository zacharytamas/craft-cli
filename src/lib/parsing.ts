export function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid ${label} JSON.`);
  }
}

export function parseNumber(value: unknown, label: string): number {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${label} value: ${String(value)}`);
  }
  return parsed;
}

export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function parseKeyValueList(values: string[], label: string): Array<[string, string]> {
  return values.map((value) => parseKeyValue(value, label));
}

export function parseKeyValue(value: string, label: string): [string, string] {
  const index = value.indexOf("=");
  if (index === -1) {
    throw new Error(`${label} must be in key=value format.`);
  }
  const key = value.slice(0, index).trim();
  const val = value.slice(index + 1);
  if (!key) {
    throw new Error(`${label} key is required.`);
  }
  return [key, val];
}

export function normalizeAccept(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === "markdown" || normalized === "text/markdown") {
    return "text/markdown";
  }
  if (normalized === "json" || normalized === "application/json") {
    return "application/json";
  }
  return String(value);
}

export function requireConfirm(confirm: unknown, command: string): void {
  if (!confirm) {
    throw new Error(
      `Refusing to run ${command} without --confirm (destructive action).`,
    );
  }
}
