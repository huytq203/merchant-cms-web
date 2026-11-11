import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroup,
  assignGroupUsers,
  listGroupUsers,
  listPermissionCatalog,
  listPermissionGroups,
  updatePermissionGroup,
} from "../permission.service";

const base = "https://merchant.test/api/v1/merchant";
const path = `${base}/permission-groups`;
const merchantId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const group = { id, merchantId, name: "Nhóm", system: false, permissions: ["VIEW_ORDER"], createdAt: null };
const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"], scopeLevel: "MASTER" as const };
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 10 });

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("permission group service", () => {
  it("reads the catalog", async () => {
    mswServer.use(http.get(`${base}/merchant-permissions`, () => HttpResponse.json(envelope([{ code: "VIEW_ORDER", category: "ORDER" }]))));
    expect(await listPermissionCatalog()).toMatchObject({ success: true, data: [{ code: "VIEW_ORDER" }] });
  });

  it("sends list filters and maps a Page", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([group])));
    }));
    expect(await listPermissionGroups({ merchantId, page: 2, pageSize: 10, query: "Nhóm" })).toMatchObject({ success: true, data: { rows: [group], total: 1 } });
    expect(Object.fromEntries(query!)).toEqual({ merchantId, page: "2", size: "10", query: "Nhóm" });
  });

  it("maps an empty Page", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json(envelope(page([])))));
    expect(await listPermissionGroups({ merchantId, page: 1, pageSize: 10 })).toMatchObject({ success: true, data: { rows: [], total: 0 } });
  });

  it("preserves a 403 and rejects a bad detail", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: "Cấm" }, { status: 403 })));
    expect(await listPermissionGroups({ merchantId, page: 1, pageSize: 10 })).toMatchObject({ success: false, error: { status: 403, message: "Cấm" } });
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope({ id }))));
    expect(await getPermissionGroup(id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("creates and updates with mapped bodies", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(path, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(envelope(group));
    }));
    mswServer.use(http.put(`${path}/${id}`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(envelope(group));
    }));
    expect(await createPermissionGroup(values, merchantId)).toMatchObject({ success: true });
    expect(await updatePermissionGroup(id, values)).toMatchObject({ success: true });
    expect(bodies).toEqual([
      { merchantId, code: "GROUP_1", name: "Nhóm", permissions: ["VIEW_ORDER"], scopeLevel: "MASTER" },
      { code: "GROUP_1", name: "Nhóm", permissions: ["VIEW_ORDER"], scopeLevel: "MASTER" },
    ]);
  });

  it("accepts a bodyless 204 delete", async () => {
    mswServer.use(http.delete(`${path}/${id}`, () => new HttpResponse(null, { status: 204 })));
    expect(await deletePermissionGroup(id)).toEqual({ success: true, data: undefined });
  });

  it("preserves a 409 delete message", async () => {
    mswServer.use(http.delete(`${path}/${id}`, () => HttpResponse.json({ success: false, message: "Nhóm còn người dùng" }, { status: 409 })));
    expect(await deletePermissionGroup(id)).toMatchObject({ success: false, error: { status: 409, message: "Nhóm còn người dùng" } });
  });

  it("lists users in a group", async () => {
    mswServer.use(http.get(`${path}/${id}/users`, () => HttpResponse.json(envelope(page([])))));
    expect(await listGroupUsers(id, 1)).toMatchObject({ success: true, data: { rows: [], total: 0 } });
  });

  it("assigns users with the UUID array required by the merchant endpoint", async () => {
    let body: unknown;
    mswServer.use(http.post(`${path}/${id}/assign-users`, async ({ request }) => {
      body = await request.json();
      return new HttpResponse(null, { status: 204 });
    }));

    expect(await assignGroupUsers(id, [merchantId])).toEqual({ success: true, data: undefined });
    expect(body).toEqual([merchantId]);
  });
});
