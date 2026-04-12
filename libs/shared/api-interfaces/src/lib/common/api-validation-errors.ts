export type ApiValidationErrors<T extends Record<string, unknown>> = {
  [K in keyof T]?: Array<string>;
};
