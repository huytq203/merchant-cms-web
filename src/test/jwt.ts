const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

/** Builds an unsigned JWT-shaped string for tests that only read the payload. */
export function fakeJwt(payload: Record<string, unknown>): string {
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.signature`;
}
