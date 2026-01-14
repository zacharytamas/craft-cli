export type GlobalOptions = {
  url?: string;
  token?: string;
};

export type ResolvedOptions = {
  baseUrl: string;
  token?: string;
  timeoutMs: number;
};

export type QueryValue = string | string[];

export type RequestConfig = {
  method: string;
  path: string;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  body?: string;
  raw?: boolean;
  contentType?: string;
};
