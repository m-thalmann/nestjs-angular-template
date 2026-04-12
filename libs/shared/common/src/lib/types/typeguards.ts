export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNone(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isNotNone<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
