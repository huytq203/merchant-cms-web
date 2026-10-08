// @vitest-environment jsdom
import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  SessionProvider,
  useHasPermission,
  useSession,
} from "@/features/auth/components/session-provider";
import type { SessionUser } from "@/types/auth";

const session: SessionUser = {
  userId: "u-1",
  username: "An",
  status: "ACTIVE",
  merchantIds: [],
  subMerchantIds: [],
  permissions: ["VIEW_ORDER"],
  authorizationVersion: 1,
};

describe("SessionProvider", () => {
  it("exposes the session and permission checks to descendants", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider session={session}>{children}</SessionProvider>
    );
    expect(renderHook(() => useSession(), { wrapper }).result.current.username).toBe("An");
    expect(renderHook(() => useHasPermission("VIEW_ORDER"), { wrapper }).result.current).toBe(true);
    expect(renderHook(() => useHasPermission("MANAGE_USER"), { wrapper }).result.current).toBe(false);
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useSession())).toThrow("useSession must be used within SessionProvider");
  });

  it("renders its children", () => {
    render(
      <SessionProvider session={session}>
        <p>content</p>
      </SessionProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
