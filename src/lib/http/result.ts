export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E; code?: string };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function fail<E = string>(error: E, code?: string): Result<never, E> {
  return { success: false, error, code };
}

export function isOk<T, E>(
  r: Result<T, E>,
): r is { success: true; data: T } {
  return r.success;
}
