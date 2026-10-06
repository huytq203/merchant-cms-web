// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUserDialogs } from "./use-user-dialogs";

describe("user dialogs", () => {
  it("opens a targeted dialog and closes it", () => {
    const { result } = renderHook(() => useUserDialogs());
    const user = { id: "user-1", fullName: "Test User" };
    act(() => result.current.openFor("lock", user as never));
    expect(result.current.activeDialog).toBe("lock");
    expect(result.current.target?.id).toBe("user-1");
    act(() => result.current.close());
    expect(result.current.activeDialog).toBeNull();
  });
});
