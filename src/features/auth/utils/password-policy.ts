/** Identity codes (AUTH_PASSWORD_*) meaning the password itself was rejected, not the code or the link. */
const POLICY_CODES: ReadonlySet<string> = new Set([
  "20009", "20010", "20011", "20012", "20013", "20014", "20015", "20016", "20017", "20018", "20019",
]);

export const isPasswordPolicyCode = (code: string | undefined): boolean => code !== undefined && POLICY_CODES.has(code);
