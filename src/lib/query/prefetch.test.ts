import { describe, expect, it, vi } from "vitest";

import { fail, ok } from "@/lib/http/result";
import type { BeError } from "@/lib/be/errors";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

const error = (status: number, code: string): BeError => ({ status, code, message: "m" });

describe("unwrapOrRedirect", () => {
  it("returns the data of a successful result", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(unwrapOrRedirect(ok({ id: 1 }))).toEqual({ id: 1 });
  });

  it("redirects to the session-expired route on 401", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(() => unwrapOrRedirect(fail(error(401, "UNAUTHORIZED"), "UNAUTHORIZED"))).toThrow(
      "NEXT_REDIRECT:/api/v1/admin/auth/session-expired",
    );
  });

  it("throws the error code for other failures so the client can refetch", async () => {
    const { unwrapOrRedirect } = await import("@/lib/query/prefetch");
    expect(() => unwrapOrRedirect(fail(error(500, "HTTP_500"), "HTTP_500"))).toThrow("HTTP_500");
  });
});
