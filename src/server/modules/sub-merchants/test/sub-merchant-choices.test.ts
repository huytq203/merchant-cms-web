import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionUser } from "@/types/auth";
import { mswServer } from "@/test/msw";
import { listSubMerchantChoices } from "../sub-merchant-choices";

const BASE = "https://merchant.test";
const LIST_PATH = `${BASE}/api/v1/merchant/sub-merchants`;
const CHOICES_PATH = `${LIST_PATH}/choices`;
const ids = { a: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", b: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", c: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
const choice = (id: string, code: string, name: string) => ({ id, code, name, status: "ACTIVE" });
const envelope = (data: unknown) => ({ success: true, data });

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

const user = (permissions: SessionUser["permissions"], subMerchantIds: string[]): SessionUser =>
  ({ userId: "u", username: "u", status: "ACTIVE", merchantIds: [], merchants: [], subMerchantIds, permissions, authorizationVersion: 1 }) as SessionUser;

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", BASE);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("listSubMerchantChoices", () => {
  it("reads the light choices endpoint even for a session that may manage Subs, never the heavy list", async () => {
    let listCalled = false;
    mswServer.use(
      http.get(CHOICES_PATH, () => HttpResponse.json(envelope([choice(ids.a, "S01", "Cửa hàng A"), choice(ids.b, "S02", "Cửa hàng B")]))),
      http.get(LIST_PATH, () => { listCalled = true; return HttpResponse.json(envelope({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 100 })); }),
    );
    expect(await listSubMerchantChoices(user(["MANAGE_SUB_MERCHANT"], []))).toEqual({
      success: true,
      data: [{ id: ids.a, label: "S01 · Cửa hàng A" }, { id: ids.b, label: "S02 · Cửa hàng B" }],
    });
    expect(listCalled).toBe(false);
  });

  it("names the Subs from the choices endpoint when the session cannot manage Subs, keeping only its own", async () => {
    mswServer.use(http.get(CHOICES_PATH, () => HttpResponse.json(envelope([choice(ids.a, "S01", "Cửa hàng A"), choice(ids.b, "S02", "Cửa hàng B"), choice(ids.c, "S03", "Cửa hàng C")]))));
    expect(await listSubMerchantChoices(user(["VIEW_BALANCE"], [ids.c, ids.a]))).toEqual({
      success: true,
      data: [
        { id: ids.a, label: "S01 · Cửa hàng A" },
        { id: ids.c, label: "S03 · Cửa hàng C" },
      ],
    });
  });

  it("offers every Sub the endpoint returns when the session is not limited to given Subs", async () => {
    mswServer.use(http.get(CHOICES_PATH, () => HttpResponse.json(envelope([choice(ids.a, "S01", "A"), choice(ids.b, "S02", "B")]))));
    const result = await listSubMerchantChoices(user(["VIEW_HOLD"], []));
    expect(result).toEqual({ success: true, data: [{ id: ids.a, label: "S01 · A" }, { id: ids.b, label: "S02 · B" }] });
  });

  it("falls back to positional labels when the BE has no choices endpoint yet", async () => {
    mswServer.use(http.get(CHOICES_PATH, () => HttpResponse.json({ success: false, message: "Not found" }, { status: 404 })));
    expect(await listSubMerchantChoices(user(["VIEW_BALANCE"], [ids.b, ids.a]))).toEqual({
      success: true,
      data: [
        { id: ids.b, label: "Sub-merchant 1" },
        { id: ids.a, label: "Sub-merchant 2" },
      ],
    });
  });

  it("falls back to positional labels when the choices call fails for any other reason", async () => {
    mswServer.use(http.get(CHOICES_PATH, () => HttpResponse.json({ success: false, message: "boom" }, { status: 500 })));
    const result = await listSubMerchantChoices(user(["VIEW_REFUND"], [ids.a]));
    expect(result).toEqual({ success: true, data: [{ id: ids.a, label: "Sub-merchant 1" }] });
  });
});
