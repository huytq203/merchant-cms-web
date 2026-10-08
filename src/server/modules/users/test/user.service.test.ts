import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  assignUserGroups,
  approveScopeProposal,
  createUser,
  getUser,
  listUsers,
  lockUser,
  getScopeProposal,
  rejectScopeProposal,
  resetUserPassword,
  unlockUser,
  updateUser,
} from "../user.service";

const path = "https://merchant.test/api/v1/merchant/merchant-users";
const id = "22222222-2222-4222-8222-222222222222";
const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "33333333-3333-4333-8333-333333333333";
const user = {
  id,
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  phone: null,
  active: true,
  locked: false,
  groups: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
  rolesText: "Vận hành",
  createdAt: "2026-10-05T10:00:00",
};
const envelope = (data: unknown) => ({ success: true, data });
const values = {
  email: user.email,
  fullName: "Test User",
  phone: "",
  groupIds: [groupId],
  merchantIds: [],
  subMerchantIds: [],
};

/** Replies with the user envelope and records the JSON body of every call. */
function recordBodies(method: "post" | "put", url: string, bodies: unknown[]) {
  mswServer.use(http[method](url, async ({ request }) => {
    bodies.push(await request.json());
    return HttpResponse.json(envelope(user));
  }));
}

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("merchant user service", () => {
  it("maps an empty Page and forwards filters", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }));
    }));
    const result = await listUsers({ merchantId, page: 1, pageSize: 10, query: "test" });
    expect(result).toMatchObject({ success: true, data: { rows: [], total: 0 } });
    expect(Object.fromEntries(query!)).toEqual({ merchantId, page: "1", size: "10" });
  });

  it("preserves the 403 reason and rejects invalid detail data", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: "Không có quyền" }, { status: 403 })));
    expect(await listUsers({ merchantId, page: 1, pageSize: 10 })).toMatchObject({
      success: false,
      error: { status: 403, message: "Không có quyền" },
    });
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope({ id }))));
    expect(await getUser(id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("creates and updates using the BE request contracts", async () => {
    const bodies: unknown[] = [];
    recordBodies("post", path, bodies);
    recordBodies("put", `${path}/${id}`, bodies);
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope(user))));
    expect(await createUser(values, merchantId)).toMatchObject({ success: true });
    expect(await updateUser(id, values)).toMatchObject({ success: true });
    expect(bodies).toEqual([
      {
        email: user.email,
        fullName: "Test User",
        groupIds: [groupId],
        merchantIds: [merchantId],
        subMerchantIds: [],
      },
      { fullName: "Test User" },
    ]);
  });

  it("accepts the slim PUT response and returns the re-read detail", async () => {
    const slim = { id, email: user.email, fullName: "Test User", status: "PENDING", groupIds: [groupId], updatedAt: "2026-10-08T10:03:16" };
    mswServer.use(
      http.put(`${path}/${id}`, () => HttpResponse.json(envelope(slim))),
      http.get(`${path}/${id}`, () => HttpResponse.json(envelope(user))),
    );
    expect(await updateUser(id, values)).toMatchObject({ success: true, data: { id, isActive: true, rolesText: "Vận hành" } });
  });

  it("locks, unlocks and assigns groups through merchant actions", async () => {
    const bodies: unknown[] = [];
    recordBodies("post", `${path}/${id}/lock`, bodies);
    mswServer.use(http.post(`${path}/${id}/unlock`, () => HttpResponse.json(envelope(user))));
    recordBodies("post", `${path}/${id}/assign-groups`, bodies);
    expect((await lockUser(id, "Reason for lock")).success).toBe(true);
    expect((await unlockUser(id)).success).toBe(true);
    expect((await assignUserGroups(id, [groupId])).success).toBe(true);
    expect(bodies).toEqual([{ reason: "Reason for lock" }, { ids: [groupId] }]);
  });

  it("resets a password with no request body and never returns the BE payload", async () => {
    const captured: { body?: string } = {};
    mswServer.use(http.post(`${path}/${id}/reset-password`, async ({ request }) => {
      captured.body = await request.text();
      return HttpResponse.json(envelope({ ...user, password: "secret" }));
    }));
    expect(await resetUserPassword(id)).toEqual({ success: true, data: { success: true } });
    expect(captured.body).toBe("");
  });

  it("does not fail when the BE reset response has no user payload", async () => {
    mswServer.use(http.post(`${path}/${id}/reset-password`, () => HttpResponse.json(envelope(null))));
    expect(await resetUserPassword(id)).toEqual({ success: true, data: { success: true } });
  });

  it("gets, approves, and rejects the pending scope proposal nested under its user", async () => {
    const proposal = {
      id,
      merchantUserId: id,
      status: "PENDING_APPROVAL",
      merchantIds: [merchantId],
      subMerchantIds: [],
      requestReason: "Change requested",
      decisionReason: null,
      createdAt: user.createdAt,
      decidedAt: null,
    };
    let rejectBody: unknown;
    mswServer.use(
      http.get(`${path}/${id}/scope-proposal`, () => HttpResponse.json(envelope(proposal))),
      http.post(`${path}/${id}/scope-proposal/approve`, () => HttpResponse.json(envelope({ ...proposal, status: "APPROVED" }))),
      http.post(`${path}/${id}/scope-proposal/reject`, async ({ request: incoming }) => {
        rejectBody = await incoming.json();
        return HttpResponse.json(envelope({ ...proposal, status: "REJECTED" }));
      }),
    );
    expect(await getScopeProposal(id)).toMatchObject({ success: true, data: { status: "PENDING_APPROVAL" } });
    expect(await approveScopeProposal(id)).toMatchObject({ success: true, data: { status: "APPROVED" } });
    expect(await rejectScopeProposal(id, "Không phù hợp")).toMatchObject({ success: true, data: { status: "REJECTED" } });
    expect(rejectBody).toEqual({ reason: "Không phù hợp" });
  });
});
