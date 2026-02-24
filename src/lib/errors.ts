import { Schema } from "effect";

export class CliValidationError extends Schema.TaggedError<CliValidationError>()(
  "CliValidationError",
  {
    message: Schema.String,
  },
) {}

export class CliIoError extends Schema.TaggedError<CliIoError>()("CliIoError", {
  message: Schema.String,
}) {}

export class CliRequestError extends Schema.TaggedError<CliRequestError>()(
  "CliRequestError",
  {
    message: Schema.String,
  },
) {}
