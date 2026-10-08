import { beforeEach, describe, expect, it, vi } from "vitest";

const { readAccessToken, fetchMerchantSession } = vi.hoisted(() => ({ readAccessToken: vi.fn(), fetchMerchantSession: vi.fn() }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken }));
vi.mock("@/server/modules/auth/merchant-session.service", () => ({ fetchMerchantSession }));

import { getSessionState } from "@/lib/auth/session";

const token = `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify({ exp: 4102444800 }))}.signature`;
const user = { userId: "u", username: "Merchant", status: "ACTIVE", merchantIds: [], subMerchantIds: [], permissions: [], authorizationVersion: 1 };

describe("getSessionState", () => {
  beforeEach(() => {
    readAccessToken.mockReset();
    fetchMerchantSession.mockReset();
    readAccessToken.mockResolvedValue(token);
  });
  it("returns unauthenticated when there is no access token", async () => {
    readAccessToken.mockResolvedValue(null);
    expect(await getSessionState()).toEqual({ kind: "unauthenticated" });
  });
  it("returns authenticated for a valid merchant session", async () => {
    fetchMerchantSession.mockResolvedValue({ success: true, data: user });
    expect(await getSessionState()).toEqual({ kind: "authenticated", user });
  });
  it("ends the session when the backend rejects /merchant/me with 401", async () => {
    fetchMerchantSession.mockResolvedValue({ success: false, error: { status: 401, code: "HTTP_401", message: "Rejected" } });
    expect(await getSessionState()).toEqual({ kind: "unauthenticated" });
  });
  it.each([0, 403, 500, 502])("preserves the session for backend status %i", async (status) => {
    fetchMerchantSession.mockResolvedValue({ success: false, error: { status, code: "INVALID_RESPONSE", message: "Unavailable" } });
    expect(await getSessionState()).toEqual({ kind: "unavailable" });
  });
  it("preserves the session when the merchant request throws", async () => {
    fetchMerchantSession.mockRejectedValue(new Error("Network failure"));
    expect(await getSessionState()).toEqual({ kind: "unavailable" });
  });
  it("preserves the session for an invalid response with HTTP 401", async () => {
    fetchMerchantSession.mockResolvedValue({ success: false, error: { status: 401, code: "INVALID_RESPONSE", message: "Invalid response" } });
    expect(await getSessionState()).toEqual({ kind: "unavailable" });
  });
});
