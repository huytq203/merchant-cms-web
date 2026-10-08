export type Result<T, E = string> =
  | { success: true; data: T; message?: string }
  | { success: false; error: E; code?: string };

export function ok<T>(data: T, message?: string): Result<T, never> {
  return message ? { success: true, data, message } : { success: true, data };
}

export function fail<E = string>(error: E, code?: string): Result<never, E> {
  return { success: false, error, code };
}

export function isOk<T, E>(
  r: Result<T, E>,
): r is { success: true; data: T } {
  return r.success;
}
