import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/types/auth";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("../user.service", () => ({ getUser, listAssignableGroups: vi.fn() }));
import { requireOwnedUser } from "../require-user-access";

const master = "11111111-1111-4111-8111-111111111111";
const other = "33333333-3333-4333-8333-333333333333";
const target = { id: "u-1", merchantIds: [master], subMerchantIds: ["sub-1"] };
const actor = (merchantIds: string[], subMerchantIds: string[]) => ({ userId: "a", merchantIds, subMerchantIds, permissions: ["MANAGE_USER"] }) as unknown as SessionUser;

beforeEach(() => {
  getUser.mockResolvedValue({ success: true, data: target });
});

describe("requireOwnedUser", () => {
  it("answers 404 for a user of another Master when the actor holds Masters", async () => {
    expect(await requireOwnedUser("u-1", actor([other], []))).toBeInstanceOf(NextResponse);
  });

  it("returns the user when it sits in the actor's Masters", async () => {
    expect(await requireOwnedUser("u-1", actor([master], []))).toEqual(target);
  });

  it("leaves a Sub-only actor's check to the BE, which only lets it reach users of its own Subs", async () => {
    // The BE answered GET /merchant-users/{id} with requireManagedUser already; a Master check here would hide every user.
    expect(await requireOwnedUser("u-1", actor([], ["sub-1"]))).toEqual(target);
  });
});
