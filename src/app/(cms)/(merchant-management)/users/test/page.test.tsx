import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import type { DehydratedState } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { AccessDenied } from "@/features/auth/components/access-denied";
import UsersPage from "../page";

const merchantId = "11111111-1111-4111-8111-111111111111";
const beUrl = "https://merchant.test/api/v1/merchant/merchant-users";
const user = {
  id: "22222222-2222-4222-8222-222222222222",
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  phone: null,
  active: true,
  locked: false,
  groups: [],
  merchantIds: [merchantId],
  subMerchantIds: [],
  rolesText: "",
  createdAt: "2026-10-05T10:00:00",
};

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("user page prefetch", () => {
  it("asks the BE for the filtered page of the session merchant and hydrates the result", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [merchantId], permissions: ["MANAGE_USER"] });
    let search: URLSearchParams | undefined;
    mswServer.use(http.get(beUrl, ({ request }) => {
      search = new URL(request.url).searchParams;
      return HttpResponse.json({
        success: true,
        data: { content: [user], totalElements: 1, totalPages: 1, number: 0, size: 10 },
      });
    }));
    const page = await UsersPage({ searchParams: Promise.resolve({ query: "search", status: "ACTIVE" }) }) as ReactElement;
    expect(Object.fromEntries(search!)).toEqual({ merchantId, page: "1", size: "10" });
    const state = (page as ReactElement<{ state: DehydratedState }>).props.state;
    expect(JSON.stringify(state)).toContain(user.id);
  });

  it("renders access denied without MANAGE_USER", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", merchantIds: ["m"], permissions: ["VIEW_ORDER"] });
    expect(await UsersPage({ searchParams: Promise.resolve({}) })).toEqual(<AccessDenied />);
  });

  it("renders access denied instead of throwing when the session has no merchant", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", merchantIds: [], permissions: ["MANAGE_USER"] });
    expect(await UsersPage({ searchParams: Promise.resolve({}) })).toEqual(<AccessDenied />);
  });
});
